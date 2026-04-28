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
  Timestamp, where, getDocs, signInWithEmailAndPassword 
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

// --- Interfaces ---
interface Product { id: string; name: string; description: string; price: number; category: string; stock: number; imageUrl: string; createdAt: any; }
interface Category { id: string; name: string; }
interface Order { id: string; customerName: string; customerPhone: string; items: any[]; total: number; status: string; createdAt: any; }

// --- Navbar ---
const Navbar = ({ cartCount, user, isAdmin }: any) => {
  const loginAdmin = async () => {
    try {
      await signInWithEmailAndPassword(auth, 'rodrigovieiradev@outlook.com', '123456');
      toast.success('Logado como Administrador');
    } catch { toast.error('Falha no login admin'); }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md py-4 border-b border-gold/20">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="text-2xl font-serif font-bold text-gold-gradient">RÁBIA PARFUM</Link>
        <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest text-stone-400">
          <Link to="/">Catálogo</Link>
          {isAdmin && <Link to="/admin" className="text-gold font-bold">PAINEL ADMIN</Link>}
        </div>
        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative p-2 text-gold"><ShoppingCart size={20} />{cartCount > 0 && <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>}</Link>
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="text-xs text-stone-400">Sair</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => signInWithPopup(auth, googleProvider)} className="text-[10px] border-gold text-gold">Google</Button>
              <Button variant="ghost" size="sm" onClick={loginAdmin} className="text-[10px] text-stone-500">Admin</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- App Principal ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', u.uid)));
        const isDbAdmin = !userDoc.empty && userDoc.docs[0].data().role === 'admin';
        setIsAdmin(isDbAdmin || u.email === 'rodrigovieiradev@outlook.com' || u.email === 'tstrodrigovieira@gmail.com');
      } else { setIsAdmin(false); }
    });
    onSnapshot(collection(db, 'products'), s => setProducts(s.docs.map(d => ({id: d.id, ...d.data()} as Product))));
    onSnapshot(collection(db, 'categories'), s => setCategories(s.docs.map(d => ({id: d.id, ...d.data()} as Category))));
    onSnapshot(collection(db, 'orders'), s => setOrders(s.docs.map(d => ({id: d.id, ...d.data()} as Order))));
    return () => unsubAuth();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-black text-stone-200">
        <Navbar cartCount={cart.reduce((a, b) => a + b.quantity, 0)} user={user} isAdmin={isAdmin} />
        <main className="pt-24">
          <Routes>
            <Route path="/" element={<Catalog products={products} onAddToCart={(p: any) => setCart([...cart, {...p, quantity: 1}])} />} />
            <Route path="/admin" element={isAdmin ? <AdminPanel products={products} /> : <div className="text-center pt-20 text-red-500 font-bold uppercase tracking-widest">Acesso Restrito</div>} />
          </Routes>
        </main>
        <Toaster position="bottom-right" richColors />
      </div>
    </Router>
  );
}

// --- Catalog Page ---
const Catalog = ({ products, onAddToCart }: any) => (
  <div className="container mx-auto px-6 py-10">
    <h1 className="text-4xl font-serif text-gold-gradient text-center mb-12">Essências de Dubai</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {products.map((p: any) => (
        <Card key={p.id} className="bg-stone-900 border-white/5 overflow-hidden text-white">
          <img src={p.imageUrl} className="w-full h-64 object-cover" alt="" />
          <CardHeader><CardTitle>{p.name}</CardTitle><p className="text-gold">R$ {Number(p.price).toFixed(2)}</p></CardHeader>
          <CardContent><Button onClick={() => onAddToCart(p)} className="w-full bg-gold text-black">Adicionar</Button></CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// --- Admin Panel (Aqui é onde você insere os produtos) ---
const AdminPanel = ({ products }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', stock: '', imageUrl: '', description: '', category: 'Árabes' });

  const save = async () => {
    try {
      await addDoc(collection(db, 'products'), { ...form, price: Number(form.price), stock: Number(form.stock), createdAt: Timestamp.now() });
      toast.success('Produto Cadastrado!');
      setModalOpen(false);
    } catch { toast.error('Erro ao salvar'); }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl text-gold font-serif">Gestão de Estoque</h1>
        <Button onClick={() => setModalOpen(true)} className="bg-gold text-black font-bold px-8 rounded-xl hover:bg-white transition-colors">
          <Plus size={20} className="mr-2" /> NOVO PRODUTO
        </Button>
      </div>

      <div className="bg-stone-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <Table>
          <TableHeader className="bg-black/40">
            <TableRow>
              <TableHead className="text-gold">Nome</TableHead>
              <TableHead className="text-gold">Preço</TableHead>
              <TableHead className="text-gold text-right">Estoque</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p: any) => (
              <TableRow key={p.id} className="border-white/5">
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>R$ {Number(p.price).toFixed(2)}</TableCell>
                <TableCell className="text-right">{p.stock} un</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-stone-900 border-gold/20 text-white rounded-3xl">
          <DialogHeader><DialogTitle className="text-gold text-2xl font-serif">Cadastrar Novo Perfume</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-black border-white/10" />
            <div className="flex gap-4">
              <Input placeholder="Preço" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="bg-black border-white/10" />
              <Input placeholder="Estoque" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="bg-black border-white/10" />
            </div>
            <Input placeholder="URL da Foto" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="bg-black border-white/10" />
            <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-black border-white/10 h-24" />
          </div>
          <Button onClick={save} className="w-full bg-gold-gradient text-black font-bold h-12 rounded-xl">SALVAR NO BANCO</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
