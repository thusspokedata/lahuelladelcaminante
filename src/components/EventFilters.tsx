"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventCalendar } from "@/components/EventCalendar";

export function EventFilters() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha</label>
            <EventCalendar />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Género</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tango">Tango</SelectItem>
                <SelectItem value="folklore">Folklore</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="electronica">Electrónica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Artista</label>
            <Input placeholder="Buscar artista..." />
          </div>

          <Button className="w-full">Aplicar Filtros</Button>
        </CardContent>
      </Card>
    </div>
  );
} 