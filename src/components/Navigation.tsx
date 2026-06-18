import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart3, List, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: '记录' },
  { to: '/analysis', icon: BarChart3, label: '分析' },
  { to: '/records', icon: List, label: '记录管理' },
  { to: '/export', icon: Share2, label: '导出' },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-amber-100 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 min-w-[60px]',
                  isActive
                    ? 'text-amber-600'
                    : 'text-gray-400 hover:text-amber-500'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    initial={false}
                    animate={
                      isActive
                        ? {
                            scale: [1, 1.2, 1],
                            transition: { duration: 0.3 },
                          }
                        : {}
                    }
                  >
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 w-1 h-1 bg-amber-500 rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
