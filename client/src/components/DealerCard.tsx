// AutoHub DealerCard — Bilingual + Favorites support
import { Link } from 'wouter';
import { Star, MapPin, Car, BadgeCheck, Heart } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/contexts/FavoritesContext';

interface DealerCardProps {
  dealer: any;
  featured?: boolean;
}

export default function DealerCard({ dealer, featured }: DealerCardProps) {
  const { t, lang } = useI18n();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favored = isFavorite(dealer.id, 'dealer');
  const gold = 'oklch(0.72 0.18 55)';

  const PLAN_LABELS: Record<string, { ar: string; en: string }> = {
    premium: { ar: 'مميز', en: 'Premium' },
    pro: { ar: 'احترافي', en: 'Pro' },
    basic: { ar: 'أساسي', en: 'Basic' },
    free: { ar: 'مجاني', en: 'Free' },
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favored) removeFavorite(dealer.id, 'dealer');
    else addFavorite({ id: dealer.id, type: 'dealer', data: dealer });
  };

  const brands = Array.isArray(dealer.brands)
    ? dealer.brands
    : typeof dealer.brands === 'string'
      ? (() => { try { return JSON.parse(dealer.brands); } catch { return [dealer.brands]; } })()
      : [];

  return (
    <Link href={`/dealer/${dealer.slug}`}>
      <div className={`autohub-card overflow-hidden group cursor-pointer relative ${featured ? 'ring-2 ring-[oklch(0.72_0.18_55)]' : ''}`}>
        {/* Cover Image */}
        <div className="relative h-44 overflow-hidden bg-gray-100">
          {dealer.cover
            ? <img src={dealer.cover} alt={dealer.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            : <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"><Car size={32} className="opacity-30" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Plan Badge */}
          {dealer.plan && dealer.plan !== 'free' && (
            <div className="absolute top-3 start-3">
              <span className="gold-badge">★ {PLAN_LABELS[dealer.plan]?.[lang] || dealer.plan}</span>
            </div>
          )}

          {/* Verified Badge */}
          {dealer.isVerified && (
            <div className="absolute top-3 end-3 flex items-center gap-1 bg-emerald-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
              <BadgeCheck size={11} />
              {t('card_verified')}
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFav}
            className="absolute bottom-3 end-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md"
            style={{ background: favored ? 'oklch(0.65 0.22 15)' : 'rgba(255,255,255,0.9)' }}
          >
            <Heart size={14} fill={favored ? 'white' : 'none'} stroke={favored ? 'white' : 'oklch(0.4 0.01 240)'} />
          </button>

          {/* Logo */}
          {dealer.logo && (
            <div className="absolute bottom-3 start-3 w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-white">
              <img src={dealer.logo} alt={dealer.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-base text-foreground mb-1 line-clamp-1">{dealer.name}</h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-3">
            <MapPin size={12} />
            <span>{dealer.city}{dealer.neighborhood ? ` — ${dealer.neighborhood}` : ''}</span>
          </div>

          {/* Brands */}
          {brands.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {brands.slice(0, 3).map((brand: string) => (
                <span key={brand} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium">{brand}</span>
              ))}
              {brands.length > 3 && <span className="text-xs text-muted-foreground">+{brands.length - 3}</span>}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-foreground">{Number(dealer.rating || 0).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({dealer.reviewsCount || 0})</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Car size={12} />
              <span>{dealer.vehiclesCount || 0} {t('card_vehicles')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
