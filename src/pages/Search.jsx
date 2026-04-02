import { SearchIcon } from "../components/ui/icons/SearchIcon";

export default function Search() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="w-24 h-24 bg-accent/10 rounded-[2rem] flex items-center justify-center mb-8 border border-accent/20">
        <SearchIcon size={48} className="text-accent" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-4">Meal Search</h1>
      <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
        Coming Soon: Search through past menus, find your favorite dishes, and filter by nutritional needs.
      </p>
      
      <div className="mt-12 w-full max-w-xl p-1 bg-muted/20 border border-border/40 rounded-3xl backdrop-blur-md opacity-50 cursor-not-allowed">
        <div className="px-5 py-4 text-left text-muted-foreground/60 text-sm italic">
          Try searching "Paneer Tikka"...
        </div>
      </div>
    </div>
  );
}
