import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CONSULTANT_BOOKING_WEBHOOK_URL } from '@/config';
import { CheckCircle2, Calendar } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(2, "Company name is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  description: z.string().optional(),
});

export function Consultant() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      company: "",
      preferredDate: "",
      preferredTime: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    if (CONSULTANT_BOOKING_WEBHOOK_URL) {
      try {
        await fetch(CONSULTANT_BOOKING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionType: 'booking',
            name: values.fullName,
            email: values.email,
            company: values.company,
            preferredDateTime: `${values.preferredDate} ${values.preferredTime}`,
            description: values.description,
          }),
        });
      } catch (e) {
        // silent fail
      }
    }

    // Simulate network latency if webhook is empty
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-primary mb-4">Request Received</h1>
        <p className="text-lg text-muted-foreground bg-muted p-6 rounded-xl inline-block border border-border">
          {t('consultant.confirm')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Hero Banner */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img src="/brand/page-consultant.jpg" alt="Talk to a Human Consultant" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B]/90 via-[#0B3D91]/80 to-[#0B3D91]/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">{t('consultant.title')}</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">Schedule a confidential consultation with our senior supply chain experts.</p>
        </div>
      </div>

    <div className="container mx-auto px-4 py-10 sm:py-16 max-w-2xl">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground">Fill in your details and we'll confirm your session within 24 hours.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-border p-6 md:p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="john@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Logistics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Time (e.g., 10:00 AM GST) *</FormLabel>
                    <FormControl>
                      <Input placeholder="10:00 AM GST" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brief Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What would you like to discuss?" 
                      className="resize-none h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Request Consultation"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
    </div>
  );
}
