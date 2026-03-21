import { Link } from 'react-router-dom';

const Footer = () => {
       return (
              <footer className="bg-forest text-cream py-24 rounded-t-[5rem]">
                     <div className="max-w-7xl mx-auto px-8">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-16 md:gap-24">
                                   <div className="col-span-1 md:col-span-2 space-y-8">
                                          <Link to="/" className="text-4xl font-serif lowercase tracking-tight">
                                                 Curova
                                          </Link>
                                          <p className="text-cream/50 font-light leading-relaxed text-sm">
                                                 Elevating the healthcare experience through mindful design and distinguished medical expertise.
                                          </p>
                                          <div className="flex space-x-6 text-cream/40">
                                                 {/* Social Icons Placeholder */}
                                                 <span className="hover:text-accent-lime transition-colors cursor-pointer">Ig</span>
                                                 <span className="hover:text-accent-lime transition-colors cursor-pointer">Tw</span>
                                                 <span className="hover:text-accent-lime transition-colors cursor-pointer">Li</span>
                                          </div>
                                   </div>

                                   <div className="space-y-8">
                                          <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent-lime/60">Practice</h4>
                                          <ul className="space-y-4 text-sm font-light">
                                                 <li><Link to="/doctors" className="hover:text-cream transition-opacity opacity-70 hover:opacity-100">Find Specialists</Link></li>
                                                 <li><Link to="/register?role=doctor" className="hover:text-cream transition-opacity opacity-70 hover:opacity-100">Join as Doctor</Link></li>
                                                 <li><Link to="/medical-history" className="hover:text-cream transition-opacity opacity-70 hover:opacity-100">Patient Care</Link></li>
                                          </ul>
                                   </div>

                                   <div className="space-y-8">
                                          <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent-lime/60">Company</h4>
                                          <ul className="space-y-4 text-sm font-light">
                                                 <li><Link to="/about" className="hover:text-cream transition-opacity opacity-70 hover:opacity-100">Our Vision</Link></li>
                                                 <li><Link to="/careers" className="hover:text-cream transition-opacity opacity-70 hover:opacity-100">Careers</Link></li>
                                                 <li><Link to="/contact" className="hover:text-cream transition-opacity opacity-70 hover:opacity-100">Contact</Link></li>
                                          </ul>
                                   </div>

                                   <div className="space-y-8">
                                          <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent-lime/60">Legal</h4>
                                          <ul className="space-y-4 text-sm font-light">
                                                 <li><Link to="/privacy" className="hover:text-cream transition-opacity opacity-70 hover:opacity-100">Privacy Policy</Link></li>
                                                 <li><Link to="/terms" className="hover:text-cream transition-opacity opacity-70 hover:opacity-100">Terms of Service</Link></li>
                                          </ul>
                                   </div>
                            </div>

                            <div className="mt-24 pt-12 border-t border-cream/5 flex flex-col md:flex-row justify-between items-center gap-8">
                                   <p className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-bold">
                                          © {new Date().getFullYear()} Curova Health Group. All Rights Reserved.
                                   </p>
                                   <div className="flex items-center gap-4">
                                          <span className="w-1.5 h-1.5 bg-accent-lime rounded-full"></span>
                                          <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-bold">Built for Serenity</p>
                                   </div>
                            </div>
                     </div>
              </footer>
       );
};

export default Footer;
