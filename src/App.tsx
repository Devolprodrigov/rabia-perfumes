import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  ShoppingBag, Plus, Trash2, Edit, Package, Search, ShoppingCart, 
  AlertCircle, ArrowRight, Instagram, Facebook, MessageCircle, Upload, X 
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { 
  auth, db, googleProvider, signInWithPopup, signOut, onSnapshot, 
  collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, 
  Timestamp, where, getDocs 
} from './firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Types ---
interface Product { id: string; name: string; description: string; price: number; category: string; stock: number; imageUrl: string; createdAt: any; }
interface Category { id: string; name: string; }
interface OrderItem { id: string; name: string; price: number; quantity: number; }
interface Order { id: string; customerName: string; customerPhone: string; items: OrderItem[]; total: number; status: string; createdAt: any; }

// --- Sub-componentes ---
const Navbar = ({ cartCount, user, isAdmin }: any) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md py-4 border-b border-gold/20">
    <div className="container mx-auto px-6 flex justify-between items-center">
      <Link to="/" className="text-2xl font-serif font-bold text-gold-gradient">RÁBIA PARFUM</Link>
      <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest text-stone-400">
        <Link to="/" className="hover:text-white transition-colors">Catálogo</Link>
        {isAdmin && <Link to="/admin" className="text-gold hover:text-white transition-colors">Admin</Link>}
      </div>
      <div className="flex items-center gap-4">
        <Link to="/cart" className="relative p-2 text-gold">
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>}
        </Link>
        {user ? (
          <div className="flex items-center gap-2">
            <img src={user.photoURL} className="w-6 h-6 rounded-full border border-gold" alt="" />
            <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="text-xs text-stone-400">Sair</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => signInWithPopup(auth, googleProvider)} className="text-xs border-gold text-gold hover:bg-gold hover:text-black">Entrar</Button>
        )}
      </div>
    </div>
  </nav>
);

// --- Componentes de Página ---
const Catalog = ({ products, onAddToCart }: any) => (
  <div className="container mx-auto px-6 py-10">
    <header className="mb-12 text-center mt-20">
      <h1 className="text-5xl font-serif font-bold text-gold-gradient mb-4">Essências de Dubai</h1>
      <p className="text-stone-400">Fragrâncias que impõem presença e sofisticação.</p>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
      {products.map((p: any) => (
        <Card key={p.id} className="bg-stone-900 border-white/5 text-white overflow-hidden group">
          <div className="h-64 overflow-hidden">
            <img src={p.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={p.name} />
          </div>
          <CardHeader>
            <CardTitle className="font-serif">{p.name}</CardTitle>
            <p className="text-gold font-bold">R$ {p.price.toFixed(2)}</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onAddToCart(p)} className="w-full bg-gold text-black hover:bg-white transition-colors" disabled={p.stock <= 0}>
              {p.stock > 0 ? 'Adicionar ao Carrinho' : 'Esgotado'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

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
          const isUserAdmin = !userDoc.empty && userDoc.docs[0].data().role === 'admin';
          setIsAdmin(isUserAdmin || u.email === 'tstrodrigovieira@gmail.com');
        } catch (e) {
          setIsAdmin(u.email === 'tstrodrigovieira@gmail.com');
        }
      } else {
        setIsAdmin(false);
      }
    });

    const unsubP = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (s) => 
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
    
    const unsubC = onSnapshot(collection(db, 'categories'), (s) => 
      setCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as Category))));
    
    const unsubO = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (s) => 
      setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))));

    return () => { unsubAuth(); unsubP(); unsubC(); unsubO(); };
  }, []);

  const addToCart = (p: Product) => {
    if (p.stock <= 0) return toast.error('Produto esgotado');
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
    toast.success(`${p.name} adicionado!`);
  };

  const handleCheckout = async (name: string, phone: string) => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    try {
      await addDoc(collection(db, 'orders'), { 
        customerName: name, 
        customerPhone: phone, 
        items: cart, 
        total, 
        status: 'pending', 
        createdAt: Timestamp.now() 
      });
      const itemsList = cart.map(item => `- ${item.quantity}x ${item.name}`).join('%0A');
      const message = `Olá! Gostaria de finalizar minha compra na Rábia Parfum.%0A%0A*Pedido:*%0A${itemsList}%0A%0A*Total:* R$ ${total.toFixed(2)}%0A%0A*Cliente:* ${name}`;
      window.open(`https://wa.me/5541984842112?text=${message}`, '_blank');
      setCart([]);
    } catch (e) { 
      toast.error('Erro ao processar o pedido.'); 
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-black text-stone-200 selection:bg-gold selection:text-black">
        <Navbar cartCount={cart.reduce((a, b) => a + b.quantity, 0)} user={user} isAdmin={isAdmin} />
        
        <main className="pt-20">
          <Routes>
            <Route path="/" element={<Catalog products={products} onAddToCart={addToCart} />} />
            <Route path="/admin" element={isAdmin ? <AdminPanel products={products} categories={categories} orders={orders} /> : <div className="text-center pt-40">Acesso Restrito</div>} />
            <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} onCheckout={handleCheckout} />} />
          </Routes>
        </main>
        
        <Toaster position="bottom-right" richColors />
      </div>
    </Router>
  );
}

// --- Componentes Adicionais ---
const CartPage = ({ cart, setCart, onCheckout }: any) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const total = cart.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

  if (cart.length === 0) return <div className="text-center pt-40"><h2 className="text-2xl font-serif">Seu carrinho está vazio</h2><Link to="/" className="text-gold underline mt-4 block">Voltar ao catálogo</Link></div>;

  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      <h1 className="text-3xl font-serif text-gold mb-8">Seu Carrinho</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          {cart.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center bg-stone-900 p-4 rounded-xl">
              <div><p className="font-medium">{item.name}</p><p className="text-gold text-sm">R$ {item.price.toFixed(2)} x {item.quantity}</p></div>
              <Button variant="ghost" onClick={() => setCart((c: any) => c.filter((i: any) => i.id !== item.id))}><Trash2 size={16} className="text-red-500" /></Button>
            </div>
          ))}
        </div>
        <Card className="bg-stone-900 border-gold/20 p-6">
          <h2 className="text-xl font-serif text-white mb-4">Total: R$ {total.toFixed(2)}</h2>
          <div className="space-y-4">
            <Input placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} className="bg-black border-white/10" />
            <Input placeholder="Seu WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="bg-black border-white/10" />
            <Button onClick={() => onCheckout(name, phone)} className="w-full bg-gold text-black font-bold">Finalizar no WhatsApp</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

const AdminPanel = ({ products, categories, orders }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', imageUrl: '', category: '', description: '' });

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'products'), { ...formData, price: Number(formData.price), stock: Number(formData.stock), createdAt: Timestamp.now() });
      toast.success('Produto salvo!');
      setModalOpen(false);
    } catch (e) { toast.error('Erro ao salvar.'); }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-gold">Painel Administrativo</h1>
        <Button onClick={() => setModalOpen(true)} className="bg-gold text-black"><Plus size={16} className="mr-2" /> Novo Produto</Button>
      </div>
      <Tabs defaultValue="inventory">
        <TabsList className="bg-stone-900 mb-8"><TabsTrigger value="inventory">Estoque</TabsTrigger><TabsTrigger value="sales">Vendas</TabsTrigger></TabsList>
        <TabsContent value="inventory">
          <Card className="bg-stone-900 border-none">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead></TableRow></TableHeader>
              <TableBody>
                {products.map((p: any) => (<TableRow key={p.id} className="border-white/5"><TableCell>{p.name}</TableCell><TableCell>R$ {p.price.toFixed(2)}</TableCell><TableCell>{p.stock} un</TableCell></TableRow>))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="sales">
          <Card className="bg-stone-900 border-none p-4">
            {orders.map((o: any) => (<div key={o.id} className="mb-4 p-4 border-b border-white/5"><p className="font-bold">{o.customerName}</p><p className="text-gold text-sm">Total: R$ {o.total.toFixed(2)} - {o.status}</p></div>))}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-stone-900 border-gold/20 text-white">
          <DialogHeader><DialogTitle className="text-gold">Adicionar Perfume</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Nome do Produto" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black border-white/10" />
            <div className="flex gap-4">
              <Input placeholder="Preço" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-black border-white/10" />
              <Input placeholder="Estoque" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="bg-black border-white/10" />
            </div>
            <Input placeholder="URL da Imagem" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="bg-black border-white/10" />
            <Textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-black border-white/10" />
          </div>
          <DialogFooter><Button onClick={handleSave} className="bg-gold text-black w-full">Salvar Produto</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
