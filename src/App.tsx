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

  // Deduplicate categories by name
  const uniqueCategories = Array.from(new Map(categories.map(item => [item.name, item])).values());

  const filteredProducts = products.filter(p => {
    const matchesFilter = filter === 'all' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <header className="mb-24 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 inline-block"
        >
          <span className="bg-gold/10 text-gold border border-gold/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Selecionados diretamente de Dubai
          </span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-serif font-bold text-gold-gradient mb-8 tracking-tighter"
        >
          Essências que <br/><span className="italic text-stone-500">impõem presença</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-stone-300 text-lg md:text-xl leading-relaxed font-light mb-10"
        >
          Fragrâncias intensas, selecionadas em Dubai, para quem entende que presença não se pede — se impõe.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button 
            onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gold-gradient text-black font-bold h-14 px-10 rounded-2xl text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Escolher meu perfume
          </Button>
        </motion.div>
      </header>

      {/* Authority Banner Section (Added below the fold logic) */}
      <section className="mb-24 py-20 border-y border-gold/10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-100">Não é sobre cheiro.</h2>
          <p className="text-stone-400 text-lg leading-relaxed">
            É sobre como você chega… e como permanece. <br/>
            Cada fragrância da Rábia Parfum foi escolhida para marcar presença — não para passar despercebida. 
            Inspirada na intensidade e sofisticação do Oriente, nossa curadoria traz perfumes que não apenas agradam… dominam o ambiente.
          </p>
        </div>
      </section>

      <div id="products-grid" className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
            className={`rounded-full px-6 text-xs uppercase tracking-widest h-9 ${filter === 'all' ? 'bg-gold-gradient text-black border-none' : 'border-gold/30 text-gold hover:bg-gold/10'}`}
          >
            Todos
          </Button>
          {uniqueCategories.map(cat => (
            <Button 
              key={cat.id}
              variant={filter === cat.name ? 'default' : 'outline'} 
              onClick={() => setFilter(cat.name)}
              className={`rounded-full px-6 text-xs uppercase tracking-widest h-9 ${filter === cat.name ? 'bg-gold-gradient text-black border-none' : 'border-gold/30 text-gold hover:bg-gold/10'}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50" size={16} />
          <Input 
            placeholder="Buscar perfume..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full border-gold/30 bg-white/5 text-gold placeholder:text-gold/30 focus:ring-gold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(product => (
            <div key={product.id}>
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-gold/20 mb-4" size={48} />
          <h3 className="text-xl font-serif text-gold">Nenhum perfume encontrado</h3>
          <p className="text-stone-500">Tente ajustar seus filtros ou busca.</p>
        </div>
      )}
    </div>
  );
};

const Cart = ({ cart, onRemove, onUpdateQty, onCheckout }: { cart: OrderItem[], onRemove: (id: string) => void, onUpdateQty: (id: string, delta: number) => void, onCheckout: (name: string, phone: string) => void }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="pt-32 pb-20 container mx-auto px-6 max-w-5xl">
      <h1 className="text-4xl md:text-6xl font-serif font-bold text-gold-gradient mb-12 text-center uppercase tracking-tighter">Carrinho de Presença</h1>
      
      {cart.length === 0 ? (
        <div className="text-center py-32 bg-stone-900/40 rounded-[40px] border-2 border-dashed border-gold/10">
          <ShoppingBag className="mx-auto text-gold/10 mb-8" size={80} />
          <h3 className="text-3xl font-serif text-gold mb-6">Seu carrinho está vazio</h3>
          <p className="text-stone-500 mb-10 max-w-sm mx-auto">Explore nossa curadoria de Dubai e escolha a fragrância que vai definir sua presença.</p>
          <Link to="/">
            <Button className="bg-gold-gradient text-black rounded-2xl px-12 h-14 text-lg font-bold hover:scale-105 transition-transform shadow-2xl shadow-gold/10">Explorar Catálogo</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Items List - Now Full Width or Larger Container */}
          <div className="space-y-6">
            <h2 className="text-xs uppercase tracking-[0.3em] text-gold/60 font-bold mb-8 flex items-center gap-4">
              <span>Itens Selecionados</span>
              <div className="h-px bg-gold/20 flex-1" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cart.map(item => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={item.id} 
                  className="flex gap-6 items-center bg-stone-900/60 p-6 rounded-[32px] border border-white/5 shadow-xl transition-all hover:bg-stone-900/80 hover:border-gold/20"
                >
                  <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center border border-gold/10">
                    <Package className="text-gold" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif font-medium text-xl text-stone-100">{item.name}</h3>
                    <p className="text-gold font-bold">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-3 bg-black/60 rounded-full py-1 px-4 border border-gold/20">
                      <button className="text-gold hover:text-gold-light p-1" onClick={() => onUpdateQty(item.id, -1)}>-</button>
                      <span className="w-6 text-center font-bold text-stone-100">{item.quantity}</span>
                      <button className="text-gold hover:text-gold-light p-1" onClick={() => onUpdateQty(item.id, 1)}>+</button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-stone-600 hover:text-red-500 hover:bg-transparent" onClick={() => onRemove(item.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* LARGE STRIKING SUMMARY - Below Products */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] bg-stone-900/80 backdrop-blur-xl text-white rounded-[48px] p-8 md:p-12 overflow-hidden relative">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] rounded-full -mr-32 -mt-32" />
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="font-serif text-4xl md:text-5xl text-gold-gradient font-bold tracking-tighter">Resumo do Pedido</h2>
                    <p className="text-stone-400">Finalize agora para garantir sua essência de Dubai.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-stone-300 text-lg">
                      <span>Subtotal</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-300 text-lg">
                      <span>Entrega</span>
                      <span className="text-gold-light font-bold">GRÁTIS</span>
                    </div>
                    <div className="h-px bg-white/10 my-6" />
                    <div className="flex justify-between text-4xl md:text-5xl font-bold text-gold tracking-tighter">
                      <span>TOTAL</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 p-8 rounded-[32px] border border-white/5 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-[0.2em] text-gold font-bold ml-1">Quem é você?</Label>
                      <Input 
                        placeholder="Seu nome completo" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="h-14 bg-stone-900/80 border-gold/20 text-white placeholder:text-stone-600 rounded-2xl focus:ring-gold text-lg px-6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-[0.2em] text-gold font-bold ml-1">WhatsApp para Contato</Label>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)}
                        className="h-14 bg-stone-900/80 border-gold/20 text-white placeholder:text-stone-600 rounded-2xl focus:ring-gold text-lg px-6"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => onCheckout(name, phone)}
                    className="w-full bg-gold-gradient text-black font-black h-16 rounded-2xl text-xs sm:text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-gold/20 group"
                    disabled={!name || !phone}
                  >
                    FINALIZAR COMPRA NO WHATSAPP
                    <ArrowRight size={18} className="ml-3 group-hover:translate-x-2 transition-transform" />
                  </Button>
                  <p className="text-[10px] text-center text-stone-500 uppercase tracking-widest">Atendimento especializado e seguro</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminPanel = ({ products, categories, orders }: { products: Product[], categories: Category[], orders: Order[] }) => {
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    imageUrl: ''
  });

  // Deduplicate categories by name
  const uniqueCategories = Array.from(new Map(categories.map(item => [item.name, item])).values());

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        imageUrl: product.imageUrl
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
    }
    setIsProductModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 in Firestore
        toast.error('A imagem deve ter menos de 1MB para garantir o desempenho.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        createdAt: editingProduct ? editingProduct.createdAt : Timestamp.now()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'products'), data);
        toast.success('Produto adicionado com sucesso!');
      }
      setIsProductModalOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar produto.');
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete));
      toast.success('Produto excluído!');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error('Erro ao excluir produto.');
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
  };

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-gold-gradient">Painel Administrativo</h1>
        <div className="flex gap-4">
          {products.length === 0 && (
            <Button variant="outline" onClick={async () => {
              const initialCategories = ['Árabes', 'Importados', 'Exclusivos'];
              const existingNames = categories.map(c => c.name);
              
              for (const name of initialCategories) {
                if (!existingNames.includes(name)) {
                  await addDoc(collection(db, 'categories'), { name });
                }
              }
              const initialProducts = [
                { name: 'Fakhar Lattafa Gold', category: 'Árabes', price: 389, stock: 10, description: 'Uma fragrância luxuosa com notas de saída de bergamota e maçã, evoluindo para um coração floral e base amadeirada.', imageUrl: 'https://picsum.photos/seed/fakhar/800/1000' },
                { name: 'Sabah Al Ward', category: 'Árabes', price: 420, stock: 8, description: 'Perfume feminino floral oriental, com notas de pimenta rosa, tangerina e um coração de cacau e jasmim.', imageUrl: 'https://picsum.photos/seed/sabah/800/1000' },
                { name: 'Asad Bourbon', category: 'Árabes', price: 350, stock: 15, description: 'Fragrância masculina intensa com especiarias, tabaco e baunilha. Perfeito para noites marcantes.', imageUrl: 'https://picsum.photos/seed/asad/800/1000' },
                { name: 'Salvo – Maison Alhambra', category: 'Importados', price: 269, stock: 15, description: 'O Salvo é uma fragrância masculina moderna e versátil, com um aroma fresco e elegante. Ideal para o dia a dia, combina leveza e sofisticação. Família olfativa: Aromático fresco. Fixação: Média a alta. Projeção: Moderada.', imageUrl: 'https://picsum.photos/seed/salvo-alhambra/800/1000' }
              ];
              for (const p of initialProducts) {
                await addDoc(collection(db, 'products'), { ...p, createdAt: Timestamp.now() });
              }
              toast.success('Dados iniciais carregados!');
            }} className="rounded-xl border-gold/30 text-gold hover:bg-gold/10">
              Carregar Dados Iniciais
            </Button>
          )}
          <Button onClick={() => handleOpenProductModal()} className="bg-gold-gradient text-black font-bold rounded-xl">
            <Plus size={18} className="mr-2" /> Novo Produto
          </Button>
          {!products.some(p => p.name.includes('Salvo – Maison Alhambra')) && (
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  await addDoc(collection(db, 'products'), {
                    name: 'Salvo – Maison Alhambra',
                    category: 'Importados',
                    price: 269,
                    stock: 15,
                    description: 'O Salvo é uma fragrância masculina moderna e versátil, com um aroma fresco e elegante. Ideal para o dia a dia, combina leveza e sofisticação. Família olfativa: Aromático fresco. Fixação: Média a alta. Projeção: Moderada.',
                    imageUrl: 'https://picsum.photos/seed/salvo-alhambra/800/1000',
                    createdAt: Timestamp.now()
                  });
                  toast.success('Salvo – Maison Alhambra adicionado!');
                } catch (error) {
                  toast.error('Erro ao adicionar produto.');
                  handleFirestoreError(error, OperationType.WRITE, 'products');
                }
              }} 
              className="rounded-xl border-gold/30 text-gold hover:bg-gold/10"
            >
              Adicionar Salvo
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
          <TabsTrigger value="inventory" className="rounded-xl px-8 data-[state=active]:bg-gold-gradient data-[state=active]:text-black text-stone-400">Estoque</TabsTrigger>
          <TabsTrigger value="sales" className="rounded-xl px-8 data-[state=active]:bg-gold-gradient data-[state=active]:text-black text-stone-400">Histórico de Vendas</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card className="border-white/5 bg-white/5 shadow-sm rounded-3xl overflow-hidden">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-white/5">
                  <TableHead className="w-[100px] text-gold/60">Imagem</TableHead>
                  <TableHead className="text-gold/60">Nome</TableHead>
                  <TableHead className="text-gold/60">Categoria</TableHead>
                  <TableHead className="text-gold/60">Preço</TableHead>
                  <TableHead className="text-gold/60">Estoque</TableHead>
                  <TableHead className="text-right text-gold/60">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                    </TableCell>
                    <TableCell className="font-medium text-stone-200">{product.name}</TableCell>
                    <TableCell><Badge variant="outline" className="border-gold/30 text-gold">{product.category}</Badge></TableCell>
                    <TableCell className="text-stone-300">R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={product.stock <= 5 ? 'text-red-400 font-bold' : 'text-stone-300'}>
                        {product.stock} un
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-gold hover:bg-gold/10" onClick={() => handleOpenProductModal(product)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-400/10" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card className="border-white/5 bg-white/5 shadow-sm rounded-3xl overflow-hidden">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-white/5">
                  <TableHead className="text-gold/60">Data</TableHead>
                  <TableHead className="text-gold/60">Cliente</TableHead>
                  <TableHead className="text-gold/60">Itens</TableHead>
                  <TableHead className="text-gold/60">Total</TableHead>
                  <TableHead className="text-gold/60">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-stone-500 text-xs">
                      {order.createdAt?.toDate().toLocaleDateString()} {order.createdAt?.toDate().toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-stone-200">{order.customerName}</div>
                      <div className="text-xs text-stone-500">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-stone-400">
                        {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-gold">R$ {order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={
                        order.status === 'completed' ? 'bg-green-900/30 text-green-400 border-green-900' : 
                        order.status === 'pending' ? 'bg-gold/10 text-gold border-gold/30' : 'bg-red-900/30 text-red-400 border-red-900'
                      }>
                        {order.status === 'completed' ? 'Concluído' : order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl bg-stone-900 border-gold/20 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-gold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription className="text-stone-400">Preencha as informações do perfume abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-stone-400">Nome</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3 rounded-xl bg-white/5 border-white/10 text-white focus:ring-gold" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-stone-400">Categoria</Label>
              <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                <SelectTrigger className="col-span-3 rounded-xl bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-stone-900 border-gold/20 text-white">
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name} className="focus:bg-gold focus:text-black">{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right text-stone-400">Preço</Label>
              <Input id="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="col-span-3 rounded-xl bg-white/5 border-white/10 text-white focus:ring-gold" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right text-stone-400">Estoque</Label>
              <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="col-span-3 rounded-xl bg-white/5 border-white/10 text-white focus:ring-gold" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-stone-400">Imagem</Label>
              <div className="col-span-3 space-y-3">
                {formData.imageUrl && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gold/20">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFormData({...formData, imageUrl: ''})}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden" 
                      id="image-upload"
                    />
                    <Label 
                      htmlFor="image-upload" 
                      className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 cursor-pointer transition-colors"
                    >
                      <Upload size={16} /> Escolher da Galeria
                    </Label>
                  </div>
                  <div className="flex-1">
                    <Input 
                      placeholder="Ou cole a URL aqui..." 
                      value={formData.imageUrl} 
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                      className="rounded-xl bg-white/5 border-white/10 text-white focus:ring-gold" 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-stone-400">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3 rounded-xl bg-white/5 border-white/10 text-white focus:ring-gold" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductModalOpen(false)} className="rounded-xl border-white/10 text-stone-400 hover:bg-white/5 hover:text-white">Cancelar</Button>
            <Button onClick={handleSaveProduct} className="bg-gold-gradient text-black font-bold rounded-xl">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl bg-stone-900 border-gold/20 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-gold">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-stone-400">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl border-white/10 text-stone-400 hover:bg-white/5 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={confirmDeleteProduct} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">
              Excluir Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorInfo: string }> {
  state = { hasError: false, errorInfo: '' };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
          <Card className="max-w-md w-full rounded-3xl p-8 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-serif font-bold mb-4">Ops! Algo deu errado</h2>
            <p className="text-stone-500 mb-6 text-sm">Ocorreu um erro inesperado. Por favor, tente recarregar a página.</p>
            <pre className="bg-stone-100 p-4 rounded-xl text-[10px] text-left overflow-auto mb-6 max-h-32">
              {this.state.errorInfo}
            </pre>
            <Button onClick={() => window.location.reload()} className="w-full bg-stone-900 text-white rounded-xl">
              Recarregar Página
            </Button>
          </Card>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(u => {
      setUser(u);
      if (u) {
        // Check if admin
        setIsAdmin(u.email === 'tstrodrigovieira@gmail.com');
      } else {
        setIsAdmin(false);
      }
    });

    const unsubscribeProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const unsubscribeOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeOrders();
    };
  }, []);

  const addToCart = (product: Product) => {
    const currentStock = product.stock || 0;
    if (currentStock <= 0) {
      toast.error('Produto esgotado');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= currentStock) {
          toast.error('Limite de estoque atingido');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const updateCartQty = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    const stock = product?.stock || 0;

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        let newQty = item.quantity + delta;
        if (newQty > stock) {
          toast.error('Limite de estoque atingido');
          newQty = stock;
        }
        newQty = Math.max(1, newQty);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.info('Item removido do carrinho');
  };

  const handleCheckout = async (customerName: string, customerPhone: string) => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const orderData = {
      customerName,
      customerPhone,
      items: cart,
      total,
      status: 'pending',
      createdAt: Timestamp.now()
    };

    // Save order to history
    try {
      await addDoc(collection(db, 'orders'), orderData);
    } catch (error) {
      toast.error('Erro ao processar pedido. Por favor, tente novamente.');
      handleFirestoreError(error, OperationType.WRITE, 'orders');
      return;
    }
    
    // Update stock
    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        try {
          await updateDoc(doc(db, 'products', product.id), {
            stock: Math.max(0, product.stock - item.quantity)
          });
        } catch (error) {
          console.warn('Failed to update stock:', error);
          // We don't block the checkout if stock update fails, but we log it
        }
      }
    }

    // Generate WhatsApp message
    const itemsList = cart.map(item => `- ${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2)})`).join('%0A');
    const message = `Olá! Gostaria de finalizar minha compra na Rábia Parfum.%0A%0A*Pedido:*%0A${itemsList}%0A%0A*Total:* R$ ${total.toFixed(2)}%0A%0A*Cliente:* ${customerName}%0A*WhatsApp:* ${customerPhone}`;
    
    const whatsappUrl = `https://wa.me/5541984842112?text=${message}`;
    
    setCart([]);
    toast.success('Pedido realizado! Redirecionando para o WhatsApp...');
    
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-stone-200 selection:bg-gold selection:text-black">
        <Navbar cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} user={user} isAdmin={isAdmin} />
        
        <main>
          <Routes>
            <Route path="/" element={<Catalog products={products} categories={categories} onAddToCart={addToCart} />} />
            <Route path="/cart" element={<Cart cart={cart} onRemove={removeFromCart} onUpdateQty={updateCartQty} onCheckout={handleCheckout} />} />
            <Route path="/admin" element={isAdmin ? <AdminPanel products={products} categories={categories} orders={orders} /> : <Catalog products={products} categories={categories} onAddToCart={addToCart} />} />
            <Route path="/about" element={
              <div className="pt-32 pb-20 container mx-auto px-6 max-w-3xl">
                <header className="text-center mb-16">
                  <h1 className="text-5xl md:text-6xl font-serif font-bold mb-8 text-gold-gradient tracking-tighter">Nossa Essência</h1>
                  <p className="text-xl text-stone-200 font-light leading-relaxed mb-6 italic">
                    "Cheiro de presença, não de passagem."
                  </p>
                </header>

                <div className="space-y-12 text-stone-400 text-lg leading-relaxed mb-16">
                  <p>
                    A Rábia Parfum nasceu do desejo de trazer a sofisticação e o mistério das fragrâncias orientais para quem não aceita passar despercebido. 
                    Nossa curadoria é feita com um olhar criterioso diretamente de Dubai, focada em fragrâncias autênticas que impõem respeito e elegância.
                  </p>
                  
                  <div className="bg-stone-900/50 border border-gold/10 p-8 rounded-3xl text-center">
                    <p className="text-gold font-serif text-2xl italic mb-4">"Forte, elegante e impossível de ignorar."</p>
                    <p className="text-xs uppercase tracking-widest opacity-60">Filosofia Rábia Parfum</p>
                  </div>

                  <p>
                    Não trabalhamos apenas com perfumes. Trabalhamos com autoridade. Cada frasco em nosso estoque representa uma escolha estratégica para quem entende que o aroma é a primeira e a última impressão de uma presença vitoriosa.
                  </p>
                </div>

                <div className="aspect-video rounded-3xl overflow-hidden bg-stone-900 border border-gold/20 mb-12 shadow-2xl shadow-gold/10">
                  <img 
                    src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1200&h=800" 
                    alt="Burj Khalifa Dubai" 
                    className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-1000"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            } />
          </Routes>
        </main>

        <footer className="bg-black border-t border-gold/10 text-white py-20">
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-serif font-bold mb-6 text-gold-gradient">RÁBIA PARFUM</h2>
              <p className="text-stone-400 max-w-sm mb-8">
                Fragrâncias intensas selecionadas diretamente em Dubai. Presença que se impõe através da sofisticação do Oriente.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="rounded-full border-gold/30 text-gold hover:bg-gold hover:text-black transition-all">
                  <Instagram size={20} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-gold/30 text-gold hover:bg-gold hover:text-black transition-all">
                  <Facebook size={20} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-gold/30 text-gold hover:bg-gold hover:text-black transition-all">
                  <MessageCircle size={20} />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-6 text-gold/50">Links</h4>
              <ul className="space-y-4 text-sm">
                <li><Link to="/" className="text-stone-400 hover:text-gold transition-colors">Catálogo</Link></li>
                <li><Link to="/about" className="text-stone-400 hover:text-gold transition-colors">Sobre Nós</Link></li>
                <li><Link to="/cart" className="text-stone-400 hover:text-gold transition-colors">Carrinho</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-6 text-gold/50">Contato</h4>
              <ul className="space-y-4 text-sm text-stone-400">
                <li>contato@rabiaparfum.com.br</li>
                <li>+55 (41) 98484-2112</li>
                <li>Curitiba, PR</li>
              </ul>
            </div>
          </div>
          <div className="container mx-auto px-6 pt-20 mt-20 border-t border-white/5 text-center text-xs text-stone-600 uppercase tracking-widest">
            © 2024 Rábia Parfum. Todos os direitos reservados.
          </div>
        </footer>

        <Toaster position="bottom-right" />
      </div>
  );
}
