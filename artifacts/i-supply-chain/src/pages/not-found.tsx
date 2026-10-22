import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'wouter';

export default function NotFound() {
  const { lang } = useLanguage();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              {lang === 'ar' ? '404 الصفحة غير موجودة' : '404 Page Not Found'}
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {lang === 'ar'
              ? 'عذرًا، الصفحة التي تبحث عنها غير متوفرة.'
              : 'Sorry, the page you are looking for is not available. It may have moved or the address may be mistyped.'}
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-blue-700 underline">
            {lang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to the home page'}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
