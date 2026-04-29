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
  increment // Importante para o estoque
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

// --- Interfaces ---
interface Product { id: string; name: string; description: string; price: number; category: string; stock: number; imageUrl: string; createdAt: any; }
interface OrderItem { id: string; name: string; price: number; quantity: number; }
interface Order { id: string; customerName: string; customerPhone: string; items: OrderItem[]; total: number; status: string; createdAt: any; }

// --- Navbar ---
const Navbar = ({ cartCount, user, isAdmin }: any) => {
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
        <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-stone-400">
          <Link to="/" className="hover:text-gold transition-colors">Catálogo</Link>
          {isAdmin && <Link to="/admin" className="text-gold-light font-bold hover:text-gold">ADMIN</Link>}
        </div>
        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative p-2 text-gold">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">{cartCount}</span>}
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-gold/30" />
              <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="text-[10px] text-stone-500 uppercase tracking-widest hover:text-gold">Sair</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => signInWithPopup(auth, googleProvider)} className="text-[10px] uppercase border-gold/50 text-gold hover:bg-gold hover:text-black">Entrar</Button>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- Admin Panel ---
const AdminPanel = ({ products, orders }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });

  // FUNÇÃO PARA PUXAR DA GALERIA
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { 
        toast.error('Imagem muito grande! Use fotos com menos de 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const save = async () => {
    if (!form.imageUrl) return toast.error("Selecione uma imagem");
    const data = { 
      ...form, 
      price: parseFloat(form.price), 
      stock: parseInt(form.stock), 
      createdAt: editing ? editing.createdAt : Timestamp.now() 
    };
    try {
      if (editing) await updateDoc(doc(db, 'products', editing.id), data);
      else await addDoc(collection(db, 'products'), data);
      setIsModalOpen(false);
      toast.success('Produto salvo!');
    } catch { toast.error('Erro ao salvar.'); }
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
              <TableHeader className="bg-black/40"><TableRow className="border-white/5"><TableHead className="text-gold">Produto</TableHead><TableHead className="text-gold">Preço</TableHead><TableHead className="text-gold">Estoque</TableHead><TableHead className="text-right text-gold">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {products.map((p: any) => (
                  <TableRow key={p.id} className="border-white/5">
                    <TableCell className="font-bold text-stone-200">{p.name}</TableCell>
                    <TableCell>R$ {p.price.toFixed(2)}</TableCell>
                    <TableCell className={p.stock <= 3 ? "text-red-400 font-bold" : "text-stone-300"}>{p.stock} un</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setForm({ ...p, price: p.price.toString(), stock: p.stock.toString() }); setIsModalOpen(true); }} className="text-gold"><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { if(confirm('Excluir produto?')) await deleteDoc(doc(db, 'products', p.id)) }} className="text-red-500"><Trash2 size={16} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="sales">
           <div className="space-y-4">
             {orders.map((o:any) => (
               <div key={o.id} className="p-4 bg-stone-900/40 border border-white/5 rounded-xl flex justify-between items-center">
                 <div>
                   <p className="font-bold text-stone-100">{o.customerName}</p>
                   <p className="text-xs text-stone-500">{o.items.length} itens no pedido</p>
                 </div>
                 <p className="text-gold font-bold">R$ {o.total.toFixed(2)}</p>
               </div>
             ))}
           </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-stone-900 border-gold/20 text-white rounded-3xl sm:max-w-md">
          <DialogHeader><DialogTitle className="text-gold">{editing ? 'Editar' : 'Novo'} Perfume</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Foto do Produto</Label>
              <div className="flex flex-col items-center gap-4">
                {form.imageUrl && <img src={form.imageUrl} className="w-24 h-24 object-cover rounded-xl border border-gold/50" />}
                <label className="w-full flex flex-col items-center justify-center h-24 border-2 border-dashed border-gold/20 rounded-2xl hover:bg-gold/5 cursor-pointer transition-colors">
                  <Upload size={24} className="text-gold/50 mb-2" />
                  <span className="text-xs text-stone-400">Clique para abrir galeria</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white/5 border-white/10" /></div>
              <div className="space-y-2"><Label>Preço</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="bg-white/5 border-white/10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Estoque Inicial</Label><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="bg-white/5 border-white/10" /></div>
              <div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-white/5 border-white/10" /></div>
            </div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-white/5 border-white/10" /></div>
          </div>
          <DialogFooter><Button onClick={save} className="w-full bg-gold-gradient text-black font-bold rounded-xl h-12">SALVAR PRODUTO</Button></DialogFooter>
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const admins = ['tstrodrigovieira@gmail.com', 'rodrigovieiradev@outlook.com', 'faculdadesabrina2025@gmail.com'];
        setIsAdmin(admins.includes(u.email || ''));
      } else setIsAdmin(false);
    });
    onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
    onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))));
  }, []);

  const handleCheckout = async (name: string, phone: string) => {
    const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
    try {
      // 1. Registrar Pedido
      await addDoc(collection(db, 'orders'), { customerName: name, customerPhone: phone, items: cart, total, status: 'pending', createdAt: Timestamp.now() });
      
      // 2. BAIXA AUTOMÁTICA DE ESTOQUE
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, {
          stock: increment(-item.quantity) // Subtrai a quantidade vendida
        });
      }

      const msg = `Olá! Pedido Rábia Parfum:%0A*Nome:* ${name}%0A*Itens:* ${cart.length}%0A*Total:* R$ ${total.toFixed(2)}`;
      window.open(`https://wa.me/5541984842112?text=${msg}`, '_blank');
      setCart([]);
      toast.success('Pedido finalizado e estoque atualizado!');
    } catch { toast.error('Erro ao processar.'); }
  };

  return (
    <Router>
      <div className="min-h-screen bg-black text-stone-200">
        <Navbar cartCount={cart.reduce((a, b) => a + b.quantity, 0)} user={user} isAdmin={isAdmin} />
        <main>
          <Routes>
            <Route path="/" element={<CatalogPage products={products} onAddToCart={(p: any) => { 
              if(p.stock <= 0) return toast.error('Produto esgotado!');
              setCart([...cart, {...p, quantity: 1}]); 
              toast.success('Adicionado ao carrinho!'); 
            }} />} />
            <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} onCheckout={handleCheckout} />} />
            <Route path="/admin" element={isAdmin ? <AdminPanel products={products} orders={orders} /> : <div className="pt-40 text-center text-stone-500">Acesso Restrito</div>} />
          </Routes>
        </main>
        <Toaster position="bottom-right" richColors />
      </div>
    </Router>
  );
}

const CatalogPage = ({ products, onAddToCart }: any) => (
  <div className="pt-32 container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
    {products.map((p: any) => (
      <Card key={p.id} className="bg-stone-900 border-white/5 overflow-hidden group">
        <div className="h-80 overflow-hidden relative">
          <img src={p.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Button onClick={() => onAddToCart(p)} className="bg-gold text-black font-bold rounded-xl" disabled={p.stock <= 0}>
               {p.stock > 0 ? 'Comprar Agora' : 'Esgotado'}
             </Button>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-stone-100 font-serif">{p.name}</CardTitle>
          <div className="flex justify-between items-center mt-2">
            <p className="text-gold font-bold">R$ {p.price.toFixed(2)}</p>
            <Badge variant="outline" className="text-[10px] border-white/10 text-stone-400">
              {p.stock} em estoque
            </Badge>
          </div>
        </CardHeader>
      </Card>
    ))}
  </div>
);

const CartPage = ({ cart, setCart, onCheckout }: any) => {
  const [n, setN] = useState(''); const [p, setP] = useState('');
  const total = cart.reduce((acc:any, i:any) => acc + i.price * i.quantity, 0);
  if (cart.length === 0) return <div className="pt-40 text-center text-stone-500">Seu carrinho está vazio</div>;
  return (
    <div className="pt-32 container mx-auto px-6 max-w-2xl space-y-8 pb-20">
      <h2 className="text-2xl font-serif text-gold">Seu Carrinho</h2>
      {cart.map((i: any) => (
        <div key={i.id} className="p-4 bg-stone-900 rounded-xl flex justify-between items-center border border-white/5">
          <div>
            <p className="font-bold">{i.name}</p>
            <p className="text-xs text-stone-500">R$ {i.price.toFixed(2)}</p>
          </div>
          <Button variant="ghost" onClick={() => setCart(cart.filter((item:any) => item.id !== i.id))}><Trash2 size={16} className="text-red-500" /></Button>
        </div>
      ))}
      <Card className="bg-stone-900 border-gold/20 p-6 space-y-4">
        <div className="flex justify-between font-bold text-xl mb-4 text-white"><span>Total:</span><span>R$ {total.toFixed(2)}</span></div>
        <Input placeholder="Seu Nome" value={n} onChange={e => setN(e.target.value)} className="bg-black border-white/10" />
        <Input placeholder="WhatsApp com DDD" value={p} onChange={e => setP(e.target.value)} className="bg-black border-white/10" />
        <Button onClick={() => onCheckout(n, p)} className="w-full bg-gold text-black font-bold h-12 rounded-xl">Finalizar no WhatsApp</Button>
      </Card>
    </div>
  );
};
