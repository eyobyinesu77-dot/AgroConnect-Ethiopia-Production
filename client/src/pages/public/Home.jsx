import { Link } from 'react-router-dom';
import { Sprout, ShoppingBasket, Users } from 'lucide-react';

const features = [
  {
    icon: Sprout,
    title: 'Farmers',
    description: 'List your harvest, reach buyers directly, and keep more of every sale — no middlemen required.',
  },
  {
    icon: ShoppingBasket,
    title: 'Buyers',
    description: 'Discover quality crops from trusted farmers, compare prices, and order with confidence.',
  },
  {
    icon: Users,
    title: 'Extension Workers',
    description: 'Connect with farmers, schedule field visits, and deliver expert advice that boosts yields.',
  },
];

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-[#f9fafb] flex flex-col justify-between">
      <div className="w-full">
        {/* Hero Section — Ethiopian agricultural marketplace image as background
            with dark overlay for text readability. Image shows farmer-buyer
            handshake, fresh produce, mountains, and local marketplace. */}
        <section
          className="relative w-full flex items-center justify-center min-h-[420px] sm:min-h-[480px] md:min-h-[560px] lg:min-h-[620px] py-20 md:py-28 px-4 md:px-8 text-center overflow-hidden bg-cover bg-center bg-no-repeat bg-[url('/images/hero-marketplace.png')]"
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/45"></div>

          {/* Hero content with white/light text */}
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg leading-tight">
              Connecting Ethiopia's Agriculture
            </h1>
            <p className="text-white/95 mb-8 text-base sm:text-lg drop-shadow-md max-w-2xl mx-auto">
              List your harvest without middlemen, discover quality crops from trusted farmers, and get extension support — all in one platform.
            </p>
            <Link
              to="/register"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base sm:text-lg px-8 py-3 rounded-lg shadow-lg transition-colors"
            >
              Get Started Today
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto py-16 px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-[#166534]">
            Built for everyone in the value chain
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Whichever role you play in Ethiopia's agriculture, AgroConnect gives you the tools to grow.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-8 border border-green-200 rounded-xl shadow-sm bg-white text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-emerald-700" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-[#166534]">{title}</h3>
                <p className="text-gray-600 text-sm">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
