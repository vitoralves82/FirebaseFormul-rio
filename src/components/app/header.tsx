"use client";

import { Logo } from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, Bell, CheckCircle, AlertTriangle } from "lucide-react";
import type { ViewMode } from "@/app/page";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Project } from "@/types";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  projectStatus?: Project['status'];
  notification?: Project['notification'];
  isRecipientSession?: boolean;
}

export function AppHeader({ view, onViewChange, projectStatus, notification, isRecipientSession }: AppHeaderProps) {
  const showNotification = projectStatus === 'concluido' && notification;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:justify-between sm:space-x-0">
        <div className="flex items-center gap-4">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline tracking-tight text-primary">
            EnvironPact Formulário
          </h1>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {showNotification && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium font-headline leading-none">Relatório Concluído</h4>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.isComprehensive ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                        Abrangente
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                        Requer Revisão
                      </Badge>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {!isRecipientSession && (
            <div className="flex items-center rounded-md bg-secondary p-1">
              <Button
                variant={view === "admin" ? "ghost" : "ghost"}
                size="sm"
                onClick={() => onViewChange("admin")}
                className={`h-8 px-3 ${view === 'admin' ? 'bg-background shadow-sm' : ''}`}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Administrador
              </Button>
              <Button
                variant={view === "recipient" ? "ghost" : "ghost"}
                size="sm"
                onClick={() => onViewChange("recipient")}
                className={`h-8 px-3 ${view === 'recipient' ? 'bg-background shadow-sm' : ''}`}
              >
                <User className="mr-2 h-4 w-4" />
                Destinatário
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
