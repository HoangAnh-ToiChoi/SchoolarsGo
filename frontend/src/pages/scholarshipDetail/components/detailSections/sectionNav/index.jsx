import { cn } from '~/utils/cn';

// Mục lục dính dưới header (top 64px). Bấm thì cuộn tới mục; người dùng bật "giảm chuyển động" thì nhảy thẳng.
export default function SectionNav({ sections, activeId, onSelect }) {
  const handleClick = (event, id) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    onSelect(id);
  };

  return (
    <nav aria-label="Mục lục" className="sticky top-16 z-10 -mx-1 flex gap-6 overflow-x-auto border-b border-line bg-canvas px-1">
      {sections.map((section) => {
        const isActive = section.id === activeId;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(event) => handleClick(event, section.id)}
            aria-current={isActive ? 'location' : undefined}
            className={cn(
              'inline-flex h-[46px] shrink-0 items-center border-b-2 px-0.5 text-sm outline-none transition-colors duration-150 focus-visible:text-brand-600 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600/40',
              isActive ? 'border-brand-600 font-bold text-brand-600' : 'border-transparent font-medium text-fg-secondary hover:text-brand-600'
            )}
          >
            {section.title}
          </a>
        );
      })}
    </nav>
  );
}
