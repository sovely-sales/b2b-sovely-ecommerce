import heroImg from '../assets/hero-shopping.png';

function Hero({ onShopNow }) {
    return (
        <section className="relative overflow-hidden bg-slate-50 pt-16 pb-24 lg:pt-24 lg:pb-32" id="hero">
            {/* Artistic Background Animated Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
                
                {/* Text Content */}
                <div className="w-full lg:w-1/2 text-center lg:text-left z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
                        <span className="text-xs font-bold tracking-widest text-slate-600 uppercase">New Era of Shopping</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm">
                        Curated style, <br className="hidden lg:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-pink-500">
                            delivered.
                        </span>
                    </h1>
                    
                    <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
                        Shopping is a bit of a relaxing hobby for me. Discover pieces that make your bank balance nervous, but your heart full.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <button 
                            onClick={onShopNow}
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 text-white font-bold tracking-wide hover:bg-accent transition-all duration-300 shadow-lg hover:shadow-accent/30 hover:-translate-y-1"
                        >
                            Start Exploring
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/80 backdrop-blur-sm text-slate-900 font-bold tracking-wide border border-slate-200 hover:border-slate-300 hover:bg-white transition-all duration-300 shadow-sm">
                            View Lookbook
                        </button>
                    </div>

                    {/* Trust Stats - Glassmorphic */}
                    <div className="mt-12 grid grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
                        <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm flex items-center gap-4 hover:bg-white/60 transition-colors cursor-default">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">✨</div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900">Premium</p>
                                <p className="text-xs text-slate-500 font-medium">Quality checked</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm flex items-center gap-4 hover:bg-white/60 transition-colors cursor-default">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">🚀</div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900">Lightning</p>
                                <p className="text-xs text-slate-500 font-medium">Fast delivery</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Composition */}
                <div className="w-full lg:w-1/2 relative mt-16 lg:mt-0 flex justify-center z-10">
                    {/* Main Image with thick glass border */}
                    <div className="relative w-full max-w-md aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-900/20 animate-float border-[8px] border-white/60 backdrop-blur-sm">
                        <img
                            src={heroImg}
                            alt="Stylish shopping"
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay Gradient to make it look premium */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent mix-blend-overlay"></div>
                    </div>
                    
                    {/* Floating glass badge */}
                    <div className="absolute -bottom-6 -left-2 sm:left-4 bg-white/90 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-accent flex items-center justify-center text-white font-bold text-lg shadow-inner">
                            50%
                        </div>
                        <div>
                            <p className="text-sm font-extrabold text-slate-900">Summer Sale</p>
                            <p className="text-xs font-medium text-slate-500">Use code SUMMER50</p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}

export default Hero;