import { useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/solid';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import SidebarNav from '~/layouts/userLayout/components/sidebarNav';

// Nút ☰ trên header (dưới lg) mở menu trượt từ trái, cùng các mục với sidebar
export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Mở menu" className="text-fg-soft lg:hidden">
          <Bars3Icon className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] px-3 py-5">
        <SheetTitle className="px-3 pb-4 text-[17px] font-bold text-fg">ScholarsGo</SheetTitle>
        <SheetDescription className="sr-only">Điều hướng chính</SheetDescription>
        <nav aria-label="Điều hướng chính">
          <SidebarNav onNavigate={() => setIsOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
