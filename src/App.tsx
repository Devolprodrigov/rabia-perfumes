import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  Plus, 
  Trash2, 
  Edit, 
  ChevronRight, 
  Package, 
  History, 
  Settings,
  LogOut,
  Search,
  Filter,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Instagram,
  Facebook,
  MessageCircle,
  Upload,
  Camera
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
  signInWithEmailAndPassword
} from './firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Types ---
interface Product { id: string; name: string; description: string; price: number; category: string; stock: number; imageUrl: string; createdAt: any; }
interface Category { id: string; name: string; }
interface OrderItem { id: string; name: string; price: number; quantity: number; }
interface Order { id: string; customerName: string; customerPhone: string; items: OrderItem[]; total: number; status: 'pending' | 'completed' | 'cancelled'; createdAt: any; }

// --- Components ---
const Navbar = ({ cartCount, user, isAdmin }: { cartCount: number, user: any, isAdmin: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAdminLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, 'rodrigovieiradev@outlook.com', '123456');
      toast.success('Acesso administrativo concedido!');
    } catch (error) {
      toast.error('Erro ao acessar como admin.');
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md py-3 border-b border-gold/20 shadow-lg shadow-gold/5' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-serif font-bold tracking-tighter text-gold-gradient">RÁBIA PARFUM</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-stone-400">
          <Link to="/" className="hover:text-gold transition-colors">Catálogo</Link>
          <Link to="/about" className="hover:text-gold transition-colors">Sobre</Link>
          {isAdmin && <Link to="/admin" className="hover:text-gold transition-colors text-gold-light font-bold border-b border-gold">Painel Admin</Link>}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative p-2 text-gold hover:bg-white/5 rounded-full transition-colors">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">{cartCount}</span>}
          </Link>
          
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="" className="w-8 h-8 rounded-full border border-gold/30" />
              <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="text-xs uppercase tracking-widest text-stone-400 hover:text-gold">Sair</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => signInWithPopup(auth, googleProvider)} className="text-[10px] sm:text-xs uppercase tracking-widest border-gold/50 text-gold hover:bg-gold hover:text-black">Google</Button>
              <Button variant="ghost" size="sm" onClick={handleAdminLogin} className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 hover:text-gold">Admin</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const ProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (p: Product) => void }) => {
  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
      <Card className="border-none shadow-none bg-transparent overflow-hidden">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-900 border border-white/5">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
          <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
            <Button onClick={() => onAddToCart(product)} className="w-full bg-gold-gradient text-black hover:scale-[1.02] border-none rounded-xl shadow-lg font-bold text-xs uppercase tracking-wider" disabled={product.stock <= 0}>
              {product.stock > 0 ? 'Comprar este' : 'Esgotado'}
            </Button>
          </div>
        </div>
        <CardHeader className="px-0 pt-4 pb-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-bold mb-1">{product.category}</p>
          <div className="flex justify-between items-start gap-2">
             <CardTitle className="text-lg font-serif font-medium text-stone-100 group-hover:text-gold transition-colors">{product.name}</CardTitle>
             <p className="text-lg font-medium text-gold whitespace-nowrap">R$ {product.price.toFixed(2)}</p>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

// --- Pages ---
const Catalog = ({ products, categories, onAddToCart }: { products: Product[], categories: Category[], onAddToCart: (p: Product) => void }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const uniqueCategories = Array.from(new Map(categories.map(item => [item.name, item])).values());
  const filtered = products.filter(p => (filter === 'all' || p.category === filter) && (p.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <header className="mb-16 text-center max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-gold-gradient mb-8 tracking-tighter">RÁBIA PARFUM</h1>
        <p className="text-stone-300 text-lg md:text-xl font-light">Fragrâncias intensas de Dubai. Presença que se impõe.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} className={`rounded-full px-6 text-xs uppercase ${filter === 'all' ? 'bg-gold text-black border-none' : 'border-gold/30 text-gold'}`}>Todos</Button>
          {uniqueCategories.map(cat => (
            <Button key={cat.id} variant={filter === cat.name ? 'default' : 'outline'} onClick={() => setFilter(cat.name)} className={`rounded-full px-6 text-xs uppercase ${filter === cat.name ? 'bg-gold text-black border-none' : 'border-gold/30 text-gold'}`}>{cat.name}</Button>
          ))}
        </div>
        <Input placeholder="Buscar perfume..." value={search} onChange={(e) => setSearch(e.target.value)} className="md:w-72 rounded-full border-gold/30 bg-white/5 text-gold" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.map(product => (<ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AdminPanel = ({ products, categories, orders }: { products: Product[], categories: Category[], orders: Order[] }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'products'), { ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock), createdAt: Timestamp.now() });
      toast.success('Produto adicionado!');
      setModalOpen(false);
    } catch (e) { toast.error('Erro ao salvar.'); }
  };

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-gold-gradient">Painel de Controle</h1>
        <Button onClick={() => setModalOpen(true)} className="bg-gold text-black font-bold rounded-xl"><Plus size={18} className="mr-2" /> Novo Produto</Button>
      </div>
      <Tabs defaultValue="inventory">
        <TabsList className="bg-stone-900 mb-8"><TabsTrigger value="inventory">Estoque</TabsTrigger><TabsTrigger value="sales">Vendas</TabsTrigger></TabsList>
        <TabsContent value="inventory">
          <Card className="bg-stone-900/50 border-white/5"><Table>
            <TableHeader><TableRow><TableHead className="text-gold">Nome</TableHead><TableHead className="text-gold">Categoria</TableHead><TableHead className="text-gold">Preço</TableHead><TableHead className="text-gold">Estoque</TableHead></TableRow></TableHeader>
            <TableBody>{products.map(p => (<TableRow key={p.id} className="border-white/5"><TableCell className="text-stone-300">{p.name}</TableCell><TableCell><Badge variant="outline">{p.category}</Badge></TableCell><TableCell>R$ {p.price.toFixed(2)}</TableCell><TableCell>{p.stock} un</TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="sales">
           <Card className="bg-stone-900/50 border-white/5 p-6">
             {orders.length === 0 ? <p className="text-stone-500">Nenhuma venda registrada ainda.</p> : orders.map(o => (
               <div key={o.id} className="mb-4 p-4 border-b border-white/5 flex justify-between items-center">
                 <div><p className="font-bold text-stone-200">{o.customerName}</p><p className="text-xs text-stone-500">{o.customerPhone}</p></div>
                 <div className="text-right"><p className="text-gold font-bold">R$ {o.total.toFixed(2)}</p><p className="text-[10px] uppercase text-stone-400">{o.status}</p></div>
               </div>
             ))}
           </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-stone-900 border-gold/20 text-white max-w-lg rounded-3xl">
          <DialogHeader><DialogTitle className="text-gold font-serif text-2xl">Cadastrar Perfume</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black border-white/10" />
            <div className="flex gap-4">
              <Input placeholder="Preço" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-black border-white/10" />
              <Input placeholder="Estoque" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="bg-black border-white/10" />
            </div>
            <Input placeholder="Categoria (ex: Árabes)" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="bg-black border-white/10" />
            <Input placeholder="URL da Imagem" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="bg-black border-white/10" />
            <Textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-black border-white/10 h-24" />
          </div>
          <Button onClick={handleSave} className="bg-gold-gradient text-black font-bold w-full h-12 rounded-xl">Salvar no Catálogo</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- App Principal ---
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
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', u.uid)));
          const isDbAdmin = !userDoc.empty && userDoc.docs[0].data().role === 'admin';
          setIsAdmin(isDbAdmin || u.email === 'tstrodrigovieira@gmail.com' || u.email === 'rodrigovieiradev@outlook.com');
        } catch {
          setIsAdmin(u.email === 'tstrodrigovieira@gmail.com' || u.email === 'rodrigovieiradev@outlook.com');
        }
      } else { setIsAdmin(false); }
    });

    const subP = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
    const subC = onSnapshot(collection(db, 'categories'), s => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as Category))));
    const subO = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))));
    return () => { unsubAuth(); subP(); subC(); subO(); };
  }, []);

  const addToCart = (p: Product) => {
    if (p.stock <= 0) return toast.error('Esgotado');
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
    toast.success('Adicionado ao carrinho!');
  };

  const handleCheckout = async (name: string, phone: string) => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    try {
      await addDoc(collection(db, 'orders'), { customerName: name, customerPhone: phone, items: cart, total, status: 'pending', createdAt: Timestamp.now() });
      const msg = `Novo Pedido na Rábia Parfum:%0A*Nome:* ${name}%0A*WhatsApp:* ${phone}%0A%0A*Itens:*%0A${cart.map(i => `- ${i.quantity}x ${i.name}`).join('%0A')}%0A%0A*Total:* R$ ${total.toFixed(2)}`;
      window.open(`https://wa.me/5541984842112?text=${msg}`, '_blank');
      setCart([]);
    } catch { toast.error('Erro ao finalizar'); }
  };

  return (
    <Router>
      <div className="min-h-screen bg-black text-stone-200">
        <Navbar cartCount={cart.reduce((a, b) => a + b.quantity, 0)} user={user} isAdmin={isAdmin} />
        <Routes>
          <Route path="/" element={<Catalog products={products} categories={categories} onAddToCart={addToCart} />} />
          <Route path="/admin" element={isAdmin ? <AdminPanel products={products} categories={categories} orders={orders} /> : <div className="pt-40 text-center"><h1>Acesso restrito para administradores.</h1></div>} />
          <Route path="/cart" element={
            <div className="pt-32 container mx-auto px-6 max-w-4xl">
              <h1 className="text-3xl text-gold mb-8 font-serif">Seu Carrinho</h1>
              {cart.length === 0 ? <p className="text-center py-20 text-stone-500">Carrinho vazio.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    {cart.map(i => (
                      <div key={i.id} className="flex justify-between bg-stone-900 p-4 rounded-xl border border-white/5">
                        <div><p className="font-bold">{i.name}</p><p className="text-gold text-sm">R$ {i.price.toFixed(2)} x {i.quantity}</p></div>
                        <Button variant="ghost" onClick={() => setCart(c => c.filter(item => item.id !== i.id))}><Trash2 size={16} className="text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                  <Card className="bg-stone-900 border-gold/30 p-6 rounded-3xl h-fit">
                     <p className="text-2xl font-bold mb-6">Total: R$ {cart.reduce((a, b) => a + b.price * b.quantity, 0).toFixed(2)}</p>
                     <div className="space-y-4">
                        <Input id="checkout-name" placeholder="Seu Nome" className="bg-black border-white/10 h-12" />
                        <Input id="checkout-phone" placeholder="WhatsApp" className="bg-black border-white/10 h-12" />
                        <Button onClick={() => handleCheckout((document.getElementById('checkout-name') as HTMLInputElement).value, (document.getElementById('checkout-phone') as HTMLInputElement).value)} className="w-full bg-gold-gradient text-black font-bold h-12 rounded-xl">Pedir no WhatsApp</Button>
                     </div>
                  </Card>
                </div>
              )}
            </div>
          } />
          <Route path="/about" element={<div className="pt-40 text-center container mx-auto px-6"><h1 className="text-4xl text-gold font-serif mb-6">Nossa Essência</h1><p className="text-stone-400 max-w-2xl mx-auto">A Rábia Parfum seleciona as melhores fragrâncias de Dubai para quem não aceita passar despercebido.</p></div>} />
        </Routes>
        <Toaster position="bottom-right" richColors />
      </div>
    </Router>
  );
}
