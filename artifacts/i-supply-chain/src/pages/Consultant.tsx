import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2, Calendar, Clock, Phone, Mail, User, Briefcase, Building2, MessageSquare } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '').replace('/i-supply-chain', '') + '/api-server/api';

const TIME_SLOTS = [
  '09:00 AM AST', '10:00 AM AST', '11:00 AM AST',
  '12:00 PM AST', '01:00 PM AST', '02:00 PM AST',
  '03:00 PM AST', '04:00 PM AST', '05:00 PM AST',
];

const SERVICE_TYPES = [
  'Supply Chain Assessment', 'Procurement Transformation', 'AI Diagnostic Review',
  'Maturity Assessment Debrief', 'Supplier Governance', 'Contract Lifecycle Management',
  'Risk & Resiliency Planning', 'Vision 2030 Alignment', 'General Consultation',
];

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(7, 'Mobile number is required'),
  designation: z.string().min(2, 'Designation is required'),
  company: z.string().min(2, 'Company name is required'),
  serviceType: z.string().min(1, 'Please select a service'),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function Consultant() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get tomorrow's date as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      designation: user?.designation || '',
      company: user?.company || '',
      serviceType: '',
      preferredDate: '',
      preferredTime: '',
      description: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE}/notify/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
    } catch {}
    await new Promise(r => setTimeout(r, 600));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    const vals = form.getValues();
    // Generate calendar link (ICS download)
    const dateStr = vals.preferredDate.replace(/-/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//I Supply Chain//EN',
      'BEGIN:VEVENT',
      `DTSTART:${dateStr}T090000Z`,
      `DTEND:${dateStr}T100000Z`,
      `SUMMARY:Supply Chain Consultation — ${vals.fullName}`,
      `DESCRIPTION:${vals.serviceType}\\n${vals.description || ''}`,
      'ORGANIZER;CN=Ma\'in Alhaqash:mailto:maen.haqash@yahoo.com',
      `ATTENDEE:mailto:${vals.email}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const icsUrl = URL.createObjectURL(blob);

    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-border p-10 max-w-lg w-full text-center space-y-5">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-primary">Booking Request Received!</h1>
          <p className="text-muted-foreground">
            Thank you, <strong>{vals.fullName}</strong>. Your request for a <strong>{vals.serviceType}</strong> session on <strong>{vals.preferredDate}</strong> at <strong>{vals.preferredTime}</strong> has been submitted. Ma'in will confirm within 24 hours via email.
          </p>
          <div className="bg-primary/5 rounded-xl p-4 text-left border border-primary/10 space-y-1 text-sm">
            <p><span className="font-semibold text-primary">Date:</span> {vals.preferredDate}</p>
            <p><span className="font-semibold text-primary">Time:</span> {vals.preferredTime}</p>
            <p><span className="font-semibold text-primary">Service:</span> {vals.serviceType}</p>
          </div>
          <a href={icsUrl} download="ISC-Consultation.ics">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-semibold w-full">
              <Calendar className="w-4 h-4 mr-2" /> Add to My Calendar (.ics)
            </Button>
          </a>
          <Link href="/">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img src="/brand/page-consultant.jpg" alt="Book a Consultation" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B]/90 via-[#0B3D91]/80 to-[#0B3D91]/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">Book a Consultation</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">Schedule a confidential session directly with Ma'in Alhaqash — confirmed within 24 hours.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {!user && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <span className="text-amber-600 text-lg mt-0.5">ℹ️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Faster booking with an account</p>
              <p className="text-amber-700 text-sm mt-0.5">
                <Link href="/login" className="underline font-bold">Sign in or register</Link> to pre-fill your details and track your appointments.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-border overflow-hidden">
          <div className="bg-primary/5 px-8 py-5 border-b border-border flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-bold text-primary text-lg">Appointment Request Form</h2>
              <p className="text-sm text-muted-foreground">All fields are required unless marked optional</p>
            </div>
          </div>

          <div className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Personal info */}
                <div className="grid md:grid-cols-2 gap-5">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Full Name *</FormLabel>
                      <FormControl><Input placeholder="Ahmed Al-Rashid" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email *</FormLabel>
                      <FormControl><Input type="email" placeholder="you@company.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="mobile" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Mobile Number *</FormLabel>
                      <FormControl><Input placeholder="+966 5XX XXX XXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="designation" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Designation *</FormLabel>
                      <FormControl><Input placeholder="e.g. Supply Chain Manager" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Company Name *</FormLabel>
                    <FormControl><Input placeholder="e.g. Saudi Aramco" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Service type */}
                <FormField control={form.control} name="serviceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Required *</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <option value="">Select a service…</option>
                        {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Date & time */}
                <div className="grid md:grid-cols-2 gap-5">
                  <FormField control={form.control} name="preferredDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Preferred Date *</FormLabel>
                      <FormControl><Input type="date" min={minDate} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="preferredTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Preferred Time (AST) *</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <option value="">Select a time slot…</option>
                          {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Brief Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your supply chain challenge or what you'd like to discuss…" className="resize-none h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={isSubmitting}
                  className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-white font-bold h-12 text-[15px] rounded-xl">
                  {isSubmitting ? 'Submitting…' : 'Request Appointment'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ma'in will review your request and confirm via email within 24 hours. Notifications go to both <strong>haqash.maen@gmail.com</strong> and <strong>maen.haqash@yahoo.com</strong>.
                </p>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
