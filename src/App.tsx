import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  handleFirestoreError
} from './firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Types ---

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  createdAt: any;
}

interface Category {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
}

// --- Components ---

const Navbar = ({ cartCount, user, isAdmin }: { cartCount: number, user: any, isAdmin: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md py-3 border-b border-gold/20 shadow-lg shadow-gold/5' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-serif font-bold tracking-tighter text-gold-gradient">RÁBIA PARFUM</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-stone-400">
          <Link to="/" className="hover:text-gold transition-colors">Catálogo</Link>
          <Link to="/about" className="hover:text-gold transition-colors">Sobre</Link>
          {isAdmin && <Link to="/admin" className="hover:text-gold transition-colors text-gold-light">Admin</Link>}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative p-2 text-gold hover:bg-white/5 rounded-full transition-colors">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold-gradient text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                {cartCount}
              </span>
            )}
          </Link>
          
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-gold/30" />
              <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="hidden sm:flex text-xs uppercase tracking-widest text-stone-400 hover:text-gold hover:bg-transparent">Sair</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => signInWithPopup(auth, googleProvider)} className="text-xs uppercase tracking-widest border-gold/50 text-gold hover:bg-gold hover:text-black transition-all">Entrar</Button>
          )}
        </div>
      </div>
    </nav>
  );
};

const ProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (p: Product) => void }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group"
    >
      <Card className="border-none shadow-none bg-transparent overflow-hidden">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-900 border border-white/5">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
          <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
            <Button 
              onClick={() => onAddToCart(product)} 
              className="w-full bg-gold-gradient text-black hover:scale-[1.02] border-none rounded-xl shadow-lg font-bold text-xs uppercase tracking-wider"
              disabled={product.stock <= 0}
            >
              {product.stock > 0 ? 'Comprar esse aqui' : 'Esgotado'}
            </Button>
          </div>
        </div>
        <CardHeader className="px-0 pt-4 pb-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-bold mb-1">{product.category}</p>
              <CardTitle className="text-lg font-serif font-medium text-stone-100 group-hover:text-gold transition-colors">{product.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(product.stock || 0) > 0 ? 'bg-white/10 text-stone-400' : 'bg-red-500/20 text-red-500'}`}>
                  {(product.stock || 0) > 0 ? `${product.stock} em estoque` : 'Esgotado'}
                </span>
                {(product.stock || 0) > 0 && (product.stock || 0) <= 5 && (
                  <span className="text-[10px] font-black text-gold animate-pulse uppercase tracking-wider">Últimas unidades!</span>
                )}
              </div>
            </div>
            <p className="text-lg font-medium text-gold">R$ {product.price.toFixed(2)}</p>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <p className="text-sm text-stone-400 line-clamp-2 leading-relaxed">{product.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Pages ---

const Catalog = ({ products, categories, onAddToCart }: { products: Product[], categories: Category[], onAddToCart: (p: Product) => void }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const uniqueCategories = Array.from(new Map(categories.map(item => [item.name, item])).values());

  const filteredProducts = products.filter(p => {
    const matchesFilter = filter === 'all' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <header className="mb-24 text-center max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 inline-block">
          <span className="bg-gold/10 text-gold border border-gold/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Selecionados diretamente de Dubai
          </span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-serif font-bold text-gold-gradient mb-8 tracking-tighter">
          Essências que <br/><span className="italic text-stone-500">impõem presença</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-stone-300 text-lg md:text-xl leading-relaxed font-light mb-10">
          Fragrâncias intensas, selecionadas em Dubai, para quem entende que presença não se pede — se impõe.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })} className="bg-gold-gradient text-black font-bold h-14 px-10 rounded-2xl text-lg hover:scale-105 transition-transform">
            Escolher meu perfume
          </Button>
        </motion.div>
      </header>

      <div id="products-grid" className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} className={`rounded-full px-6 text-xs uppercase tracking-widest h-9 ${filter === 'all' ? 'bg-gold-gradient text-black' : 'border-gold/30 text-gold'}`}>Todos</Button>
          {uniqueCategories.map(cat => (
            <Button key={cat.id} variant={filter === cat.name ? 'default' : 'outline'} onClick={() => setFilter(cat.name)} className={`rounded-full px-6 text-xs uppercase tracking-widest h-9 ${filter === cat.name ? 'bg-gold-gradient text-black' : 'border-gold/30 text-gold'}`}>{cat.name}</Button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50" size={16} />
          <Input placeholder="Buscar perfume..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-full border-gold/30 bg-white/5 text-gold" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(product => (
            <div key={product.id}><ProductCard product={product} onAddToCart={onAddToCart} /></div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Cart = ({ cart, onRemove, onUpdateQty, onCheckout }: { cart: OrderItem[], onRemove: (id: string) => void, onUpdateQty: (id: string, delta: number) => void, onCheckout: (name: string, phone: string) => void }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="pt-32 pb-20 container mx-auto px-6 max-w-5xl">
      <h1 className="text-4xl font-serif font-bold text-gold-gradient mb-12 text-center uppercase">Carrinho de Presença</h1>
      {cart.length === 0 ? (
        <div className="text-center py-32 bg-stone-900/40 rounded-[40px] border-2 border-dashed border-gold/10">
          <ShoppingBag className="mx-auto text-gold/10 mb-8" size={80} />
          <h3 className="text-3xl font-serif text-gold">Seu carrinho está vazio</h3>
          <Link to="/"><Button className="mt-8 bg-gold-gradient text-black font-bold">Explorar Catálogo</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex gap-6 items-center bg-stone-900/60 p-6 rounded-[32px] border border-white/5">
                <div className="flex-1">
                  <h3 className="font-serif font-medium text-stone-100">{item.name}</h3>
                  <p className="text-gold font-bold">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3 bg-black/60 rounded-full py-1 px-4 border border-gold/20">
                  <button className="text-gold" onClick={() => onUpdateQty(item.id, -1)}>-</button>
                  <span className="font-bold">{item.quantity}</span>
                  <button className="text-gold" onClick={() => onUpdateQty(item.id, 1)}>+</button>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onRemove(item.id)}><Trash2 size={16} /></Button>
              </div>
            ))}
          </div>
          <Card className="bg-stone-900/80 border-gold/30 p-8 rounded-[48px] text-white h-fit">
            <h2 className="text-3xl font-serif text-gold-gradient font-bold mb-6">Total: R$ {total.toFixed(2)}</h2>
            <div className="space-y-4">
              <Input placeholder="Seu nome completo" value={name} onChange={e => setName(e.target.value)} className="bg-stone-900 border-gold/20 h-14" />
              <Input placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} className="bg-stone-900 border-gold/20 h-14" />
              <Button onClick={() => onCheckout(name, phone)} className="w-full bg-gold-gradient text-black font-black h-16 rounded-2xl" disabled={!name || !phone}>FINALIZAR NO WHATSAPP</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const AdminPanel = ({ products, categories, orders }: { products: Product[], categories: Category[], orders: Order[] }) => {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
  const uniqueCategories = Array.from(new Map(categories.map(item => [item.name, item])).values());

  const handleSaveProduct = async () => {
    try {
      await addDoc(collection(db, 'products'), {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        createdAt: Timestamp.now()
      });
      toast.success('Produto adicionado!');
      setIsProductModalOpen(false);
    } catch (e) { toast.error('Erro ao salvar'); }
  };

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-gold-gradient">Painel Administrativo</h1>
        <Button onClick={() => setIsProductModalOpen(true)} className="bg-gold-gradient text-black font-bold"><Plus size={18} className="mr-2" /> Novo Produto</Button>
      </div>
      <Tabs defaultValue="inventory">
        <TabsList className="mb-8"><TabsTrigger value="inventory">Estoque</TabsTrigger><TabsTrigger value="sales">Vendas</TabsTrigger></TabsList>
        <TabsContent value="inventory">
          <Card className="bg-white/5 border-none"><Table>
            <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead></TableRow></TableHeader>
            <TableBody>{products.map(p => (<TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>R$ {p.price.toFixed(2)}</TableCell><TableCell>{p.stock} un</TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="sales">
          <Card className="bg-white/5 border-none"><Table>
            <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{orders.map(o => (<TableRow key={o.id}><TableCell>{o.customerName}</TableCell><TableCell>R$ {o.total.toFixed(2)}</TableCell><TableCell><Badge>{o.status}</Badge></TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="bg-stone-900 border-gold/20 text-white">
          <DialogHeader><DialogTitle className="text-gold">Novo Perfume</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10" />
            <Input placeholder="Preço" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-white/5 border-white/10" />
            <Input placeholder="Estoque" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="bg-white/5 border-white/10" />
            <Input placeholder="URL da Imagem" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="bg-white/5 border-white/10" />
            <Textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10" />
          </div>
          <Button onClick={handleSaveProduct} className="bg-gold-gradient text-black font-bold">Salvar Produto</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Tenta buscar o papel do usuário no banco de dados para permitir múltiplos admins
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', u.uid)));
        if (!userDoc.empty && userDoc.docs[0].data().role === 'admin') {
          setIsAdmin(true);
        } else {
          // Mantém você como admin mestre pelo e-mail
          setIsAdmin(u.email === 'tstrodrigovieira@gmail.com');
        }
      } else { setIsAdmin(false); }
    });

    const subP = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
    const subC = onSnapshot(collection(db, 'categories'), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as Category))));
    const subO = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))));

    return () => { unsubscribeAuth(); subP(); subC(); subO(); };
  }, []);

  const addToCart = (p: Product) => {
    if ((p.stock || 0) <= 0) return toast.error('Esgotado');
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
    toast.success('Adicionado!');
  };

  const handleCheckout = async (name: string, phone: string) => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    try {
      await addDoc(collection(db, 'orders'), { customerName: name, customerPhone: phone, items: cart, total, status: 'pending', createdAt: Timestamp.now() });
      const itemsList = cart.map(item => `- ${item.quantity}x ${item.name}`).join('%0A');
      const whatsappUrl = `https://wa.me/5541984842112?text=Novo Pedido:%0A${itemsList}%0A%0ATotal: R$ ${total.toFixed(2)}`;
      setCart([]);
      window.open(whatsappUrl, '_blank');
    } catch (e) { toast.error('Erro ao processar'); }
  };

  return (
    <div className="min-h-screen bg-black text-stone-200">
      <Navbar cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} user={user} isAdmin={isAdmin} />
      <Routes>
        <Route path="/" element={<Catalog products={products} categories={categories} onAddToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cart={cart} onRemove={(id) => setCart(c => c.filter(i => i.id !== id))} onUpdateQty={(id, d) => setCart(c => c.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))} onCheckout={handleCheckout} />} />
        <Route path="/admin" element={isAdmin ? <AdminPanel products={products} categories={categories} orders={orders} /> : <Catalog products={products} categories={categories} onAddToCart={addToCart} />} />
        <Route path="/about" element={<div className="pt-32 text-center h-screen"><h1>Sobre a Rábia Parfum</h1></div>} />
      </Routes>
      <Toaster position="bottom-right" />
    </div>
  );
}
