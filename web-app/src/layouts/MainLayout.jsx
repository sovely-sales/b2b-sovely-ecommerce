import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar'; 

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-accent/30">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className="flex-grow w-full relative z-0">
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;