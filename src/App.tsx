import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  User, 
  X, 
  Plus, 
  Trash2, 
  Edit, 
  Package, 
  Search, 
  ShoppingCart, 
  AlertCircle, 
  ArrowRight, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Upload 
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  onSnapshot,
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  where,
  getDocs,
  OperationType,
  handleFirestoreError,
  signInWithEmailAndPassword,
  increment
} from './firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Types ---
interface Product { id: string; name: string; description: string; price: number; category: string; stock: number; imageUrl: string; createdAt: any; }
interface Category { id: string; name: string; }
interface OrderItem { id: string; name: string; price: number; quantity: number; }
interface Order { id: string; customerName: string; customerPhone: string; items: OrderItem[]; total: number; status: 'pending' | 'completed' | 'cancelled'; createdAt: any; }

// --- Navbar ---
const Navbar = ({ cartCount, user, isAdmin }: { cartCount: number, user: any, isAdmin: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md py-3 border-b border-gold/20 shadow-lg' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="text-2xl font-serif font-bold text-gold-gradient">RÁBIA PARFUM</Link>
        <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest text-stone-400">
          <Link to="/" className="hover:text-gold transition-colors">Catálogo</Link>
          <Link to="/about" className="hover:text-gold transition-colors">Sobre</Link>
          {isAdmin && <Link to="/admin" className="text-gold-light font-bold hover:text-gold transition-colors">ADMIN</Link>}
        </div>
        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative p-2 text-gold">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">{cartCount}</span>}
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-gold/30" />
              <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="text-xs text-stone-400 uppercase tracking-widest hover:text-gold">Sair</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => signInWithPopup(auth, googleProvider)} className="text-xs uppercase border-gold/50 text-gold hover:bg-gold hover:text-black">Entrar</Button>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- Product Card ---
const ProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (p: Product) => void }) => (
  <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
    <Card className="border-none bg-transparent overflow-hidden">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-900 border border-white/5">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform">
          <Button onClick={() => onAddToCart(product)} className="w-full bg-gold-gradient text-black font-bold text-xs uppercase rounded-xl" disabled={product.stock <= 0}>
            {product.stock > 0 ? 'Adicionar ao Carrinho' : 'Esgotado'}
          </Button>
        </div>
      </div>
      <div className="pt-4 space-y-1">
        <p className="text-[10px] uppercase text-gold/60 font-bold">{product.category}</p>
        <CardTitle className="text-lg font-serif text-stone-100">{product.name}</CardTitle>
        <div className="flex justify-between items-center">
          <Badge variant="outline" className={product.stock <= 5 ? "text-red-400 border-red-400/20" : "text-stone-400 border-white/10"}>{product.stock} un</Badge>
          <p className="text-lg font-medium text-gold">R$ {product.price.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  </motion.div>
);

// --- Pages ---
const Catalog = ({ products, categories, onAddToCart }: any) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const uniqueCategories = Array.from(new Map(categories.map((item: any) => [item.name, item])).values());
  const filtered = products.filter((p: any) => (filter === 'all' || p.category === filter) && (p.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <header className="mb-16 text-center max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-gold-gradient mb-6">Rábia Parfum</h1>
        <p className="text-stone-300 text-lg">Fragrâncias selecionadas diretamente de Dubai.</p>
      </header>
      <div className="flex flex-col md:flex-row gap-6 mb-12 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} className="rounded-full px-6 text-xs uppercase">Todos</Button>
          {uniqueCategories.map((cat: any) => (
            <Button key={cat.id} variant={filter === cat.name ? 'default' : 'outline'} onClick={() => setFilter(cat.name)} className="rounded-full px-6 text-xs uppercase">{cat.name}</Button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50" size={16} />
          <Input placeholder="Buscar perfume..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-full border-gold/30 bg-white/5 text-gold" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.map((product: any) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />)}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Cart = ({ cart, onRemove, onUpdateQty, onCheckout }: any) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const total = cart.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

  return (
    <div className="pt-32 pb-20 container mx-auto px-6 max-w-5xl">
      <h1 className="text-4xl md:text-6xl font-serif font-bold text-gold-gradient mb-12 text-center uppercase">Carrinho</h1>
      {cart.length === 0 ? (
        <div className="text-center py-20 bg-stone-900/40 rounded-[40px] border-2 border-dashed border-gold/10">
          <ShoppingBag className="mx-auto text-gold/10 mb-8" size={80} />
          <h3 className="text-2xl text-gold font-serif">Carrinho vazio</h3>
          <Link to="/"><Button className="mt-8 bg-gold-gradient text-black font-bold px-10 rounded-xl">Explorar Catálogo</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            {cart.map((item: any) => (
              <div key={item.id} className="flex gap-6 items-center bg-stone-900/60 p-6 rounded-[32px] border border-white/5">
                <div className="flex-1">
                  <h3 className="font-serif font-medium text-stone-100">{item.name}</h3>
                  <p className="text-gold font-bold">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3 bg-black/60 rounded-full py-1 px-4 border border-gold/20">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="text-gold">-</button>
                  <span className="font-bold text-stone-100">{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} className="text-gold">+</button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)} className="text-stone-600 hover:text-red-500"><Trash2 size={18} /></Button>
              </div>
            ))}
          </div>
          <Card className="bg-stone-900/80 border-gold/30 p-8 rounded-[48px] text-white h-fit">
            <h2 className="text-3xl font-serif text-gold-gradient font-bold mb-8">Finalizar Pedido</h2>
            <div className="space-y-6">
              <div className="flex justify-between text-xl border-b border-white/10 pb-4 font-bold"><span>Total:</span><span>R$ {total.toFixed(2)}</span></div>
              <div className="space-y-4">
                <Input placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} className="bg-black/40 border-gold/20 h-12" />
                <Input placeholder="Seu WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="bg-black/40 border-gold/20 h-12" />
              </div>
              <Button onClick={() => onCheckout(name, phone)} disabled={!name || !phone} className="w-full bg-gold-gradient text-black font-black h-16 rounded-2xl group uppercase tracking-wider">
                Pedir no WhatsApp <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const AdminPanel = ({ products, categories, orders }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });

  const save = async () => {
    const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock), createdAt: editing ? editing.createdAt : Timestamp.now() };
    try {
      if (editing) await updateDoc(doc(db, 'products', editing.id), data);
      else await addDoc(collection(db, 'products'), data);
      setIsModalOpen(false);
      toast.success('Salvo com sucesso!');
    } catch { toast.error('Erro ao salvar'); }
  };

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-gold-gradient">Painel Admin</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' }); setIsModalOpen(true); }} className="bg-gold-gradient text-black font-bold rounded-xl"><Plus size={18} className="mr-2" /> Novo Produto</Button>
      </div>
      <Tabs defaultValue="inventory">
        <TabsList className="bg-white/5 p-1 rounded-2xl mb-8">
          <TabsTrigger value="inventory" className="rounded-xl px-8">Estoque</TabsTrigger>
          <TabsTrigger value="sales" className="rounded-xl px-8">Vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <Card className="bg-stone-900/40 border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-black/40"><TableRow className="border-white/5"><TableHead className="text-gold">Produto</TableHead><TableHead className="text-gold">Categoria</TableHead><TableHead className="text-gold">Preço</TableHead><TableHead className="text-gold">Estoque</TableHead><TableHead className="text-right text-gold">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {products.map((p: any) => (
                  <TableRow key={p.id} className="border-white/5">
                    <TableCell className="font-bold text-stone-200">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="border-gold/30 text-gold">{p.category}</Badge></TableCell>
                    <TableCell>R$ {p.price.toFixed(2)}</TableCell>
                    <TableCell className={p.stock <= 5 ? "text-red-400 font-bold" : "text-stone-300"}>{p.stock} un</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setForm({ ...p, price: p.price.toString(), stock: p.stock.toString() }); setIsModalOpen(true); }} className="text-gold"><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { if(confirm('Excluir?')) await deleteDoc(doc(db, 'products', p.id)) }} className="text-red-500"><Trash2 size={16} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="sales">
          <Card className="bg-stone-900/40 border-white/5">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {orders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.createdAt?.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>{o.customerName} - {o.customerPhone}</TableCell>
                    <TableCell className="text-gold font-bold">R$ {o.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-stone-900 border-gold/20 text-white rounded-3xl">
          <DialogHeader><DialogTitle className="text-gold">{editing ? 'Editar' : 'Novo'} Perfume</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white/5 border-white/10" /></div>
              <div className="space-y-2"><Label>Preço</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="bg-white/5 border-white/10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Estoque</Label><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="bg-white/5 border-white/10" /></div>
              <div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-white/5 border-white/10" /></div>
            </div>
            <div className="space-y-2"><Label>URL da Imagem</Label><Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="bg-white/5 border-white/10" /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-white/5 border-white/10" /></div>
          </div>
          <DialogFooter><Button onClick={save} className="w-full bg-gold-gradient text-black font-bold rounded-xl h-12">SALVAR PRODUTO</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const admins = ['tstrodrigovieira@gmail.com', 'rodrigovieiradev@outlook.com', 'faculdadesabrina2025@gmail.com'];
        setIsAdmin(admins.includes(u.email || ''));
      } else setIsAdmin(false);
    });
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
    const unsubCategories = onSnapshot(collection(db, 'categories'), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as Category))));
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))));
    return () => { unsubAuth(); unsubProducts(); unsubCategories(); unsubOrders(); };
  }, []);

  const addToCart = (p: Product) => {
    if (p.stock <= 0) return toast.error('Esgotado');
    setCart(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { id: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
    toast.success('Adicionado!');
  };

  const handleCheckout = async (customerName: string, customerPhone: string) => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    try {
      // 1. Salva Pedido
      await addDoc(collection(db, 'orders'), { customerName, customerPhone, items: cart, total, status: 'pending', createdAt: Timestamp.now() });
      
      // 2. BAIXA ESTOQUE AUTOMÁTICA
      for (const item of cart) {
        await updateDoc(doc(db, 'products', item.id), { stock: increment(-item.quantity) });
      }

      // 3. WhatsApp
      const itemsList = cart.map(i => `- ${i.quantity}x ${i.name}`).join('%0A');
      const msg = `Olá! Gostaria de finalizar minha compra.%0A%0A*Pedido:*%0A${itemsList}%0A%0A*Total:* R$ ${total.toFixed(2)}%0A%0A*Cliente:* ${customerName}`;
      window.open(`https://wa.me/5541984842112?text=${msg}`, '_blank');
      
      setCart([]);
      toast.success('Pedido registrado e estoque atualizado!');
    } catch { toast.error('Erro ao processar'); }
  };

  return (
    <Router>
      <div className="min-h-screen bg-black text-stone-200">
        <Navbar cartCount={cart.reduce((a, b) => a + b.quantity, 0)} user={user} isAdmin={isAdmin} />
        <main>
          <Routes>
            <Route path="/" element={<Catalog products={products} categories={categories} onAddToCart={addToCart} />} />
            <Route path="/cart" element={<Cart cart={cart} onRemove={(id: any) => setCart(cart.filter(i => i.id !== id))} onUpdateQty={(id: any, delta: any) => setCart(cart.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + delta)} : i))} onCheckout={handleCheckout} />} />
            <Route path="/admin" element={isAdmin ? <AdminPanel products={products} categories={categories} orders={orders} /> : <div className="pt-40 text-center">Acesso Negado</div>} />
            <Route path="/about" element={<div className="pt-40 text-center font-serif text-3xl italic text-gold">"Cheiro de presença, não de passagem."</div>} />
          </Routes>
        </main>
        <footer className="py-10 border-t border-white/5 text-center text-xs opacity-40 mt-20">© 2024 Rábia Parfum. Todos os direitos reservados.</footer>
        <Toaster position="bottom-right" richColors />
      </div>
    </Router>
  );
}
