"use client";

import type { FC } from 'react';
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { differenceInCalendarDays, addMonths, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

interface ComplianceBadgeProps {
  expiryDate: Date;
}

const ComplianceBadge: FC<ComplianceBadgeProps> = ({ expiryDate }) => {
  const today = new Date();
  today.setHours(0,0,0,0); 
  const expiry = new Date(expiryDate);
  expiry.setHours(0,0,0,0); 

  const daysUntilExpiry = differenceInCalendarDays(expiry, today);

  if (daysUntilExpiry < 0) {
    return (
      <Badge variant="destructive">
        <ShieldX className="mr-2 h-4 w-4" />
        Expirado
      </Badge>
    );
  } else if (daysUntilExpiry <= 90) {
    return (
      <Badge variant="outline" className="border-orange-500 text-orange-700">
        <ShieldAlert className="mr-2 h-4 w-4" />
        Expira pronto
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="border-green-500 text-green-700">
        <ShieldCheck className="mr-2 h-4 w-4" />
        Al día
      </Badge>
    );
  }
};

export default ComplianceBadge;