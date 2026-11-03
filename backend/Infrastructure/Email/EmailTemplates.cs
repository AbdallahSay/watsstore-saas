using System;

namespace WatsStore.Api.Infrastructure.Email
{
    public static class EmailTemplates
    {
        public static (string Subject, string HtmlBody, string PlainText) EmailVerificationOtp(string storeName, string ownerName, string otpCode, int expiryMinutes = 15)
        {
            var subject = $"رمز تأكيد البريد الإلكتروني لمتجرك في WatsStore: {otpCode}";
            var html = $@"
<!DOCTYPE html>
<html dir=""rtl"" lang=""ar"">
<head>
  <meta charset=""utf-8"">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background-color: #059669; padding: 24px; text-align: center; color: #ffffff; }}
    .content {{ padding: 32px 24px; text-align: right; line-height: 1.6; }}
    .code-box {{ background-color: #f1f5f9; border: 2px dashed #059669; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #047857; font-family: monospace; }}
    .footer {{ padding: 20px 24px; background-color: #f8fafc; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }}
    .warning {{ font-size: 13px; color: #dc2626; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class=""container"">
    <div class=""header"">
      <h1 style=""margin:0;font-size:22px;font-weight:800;"">WatsStore | تأكيد البريد الإلكتروني</h1>
    </div>
    <div class=""content"">
      <p style=""font-size:16px;margin-top:0;"">مرحباً <strong>{ownerName}</strong>،</p>
      <p>شكراً لانضمامك إلى منصة WatsStore. لتأكيد ملكية بريدك الإلكتروني وتفعيل نشر متجرك <strong>{storeName}</strong>، يرجى إدخال رمز التحقق التالي:</p>
      <div class=""code-box"">{otpCode}</div>
      <p style=""font-size:14px;color:#475569;"">صلاحية هذا الرمز هي <strong>{expiryMinutes} دقيقة</strong> فقط. لا تشارك هذا الرمز مع أي شخص.</p>
      <p class=""warning"">إذا لم تكن قد أنشأت حساباً في WatsStore، يمكنك تجاهل هذه الرسالة بأمان.</p>
    </div>
    <div class=""footer"">
      &copy; {DateTime.UtcNow.Year} WatsStore by Masar Tech. جميع الحقوق محفوظة.
    </div>
  </div>
</body>
</html>";

            var plainText = $"مرحباً {ownerName}، رمز تأكيد البريد الإلكتروني لمتجرك {storeName} في WatsStore هو: {otpCode}. هذا الرمز صالح لمدة {expiryMinutes} دقيقة.";
            return (subject, html, plainText);
        }

        public static (string Subject, string HtmlBody, string PlainText) PasswordRecoveryOtp(string storeName, string ownerName, string otpCode, int expiryMinutes = 10)
        {
            var subject = $"رمز استعادة كلمة المرور لمتجرك في WatsStore: {otpCode}";
            var html = $@"
<!DOCTYPE html>
<html dir=""rtl"" lang=""ar"">
<head>
  <meta charset=""utf-8"">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff; }}
    .content {{ padding: 32px 24px; text-align: right; line-height: 1.6; }}
    .code-box {{ background-color: #f1f5f9; border: 2px dashed #0284c7; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #0369a1; font-family: monospace; }}
    .footer {{ padding: 20px 24px; background-color: #f8fafc; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }}
    .warning {{ font-size: 13px; color: #dc2626; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class=""container"">
    <div class=""header"">
      <h1 style=""margin:0;font-size:22px;font-weight:800;"">WatsStore | استعادة كلمة المرور</h1>
    </div>
    <div class=""content"">
      <p style=""font-size:16px;margin-top:0;"">مرحباً <strong>{ownerName}</strong>،</p>
      <p>تلقينا طلباً لاستعادة كلمة المرور لحساب متجرك <strong>{storeName}</strong> في WatsStore. رمز التحقق الخاص بك هو:</p>
      <div class=""code-box"">{otpCode}</div>
      <p style=""font-size:14px;color:#475569;"">هذا الرمز صالح للاستخدام مرة واحدة فقط لمدة <strong>{expiryMinutes} دقائق</strong>.</p>
      <p class=""warning"">تنبيه أمني: إذا لم تقم بطلب استعادة كلمة المرور بنفسك، فيرجى تجاهل هذه الرسالة فوراً؛ حسابك آمن ولم يتم تغييره.</p>
    </div>
    <div class=""footer"">
      &copy; {DateTime.UtcNow.Year} WatsStore by Masar Tech. جميع الحقوق محفوظة.
    </div>
  </div>
</body>
</html>";

            var plainText = $"مرحباً {ownerName}، رمز استعادة كلمة المرور لحساب متجرك {storeName} هو: {otpCode}. صالح لمدة {expiryMinutes} دقائق.";
            return (subject, html, plainText);
        }

        public static (string Subject, string HtmlBody, string PlainText) PasswordChangedNotification(string storeName, string ownerName, DateTime changedAt)
        {
            var subject = "تم تغيير كلمة المرور لحساب متجرك في WatsStore";
            var dateStr = changedAt.ToString("yyyy-MM-dd HH:mm UTC");
            var html = $@"
<!DOCTYPE html>
<html dir=""rtl"" lang=""ar"">
<head>
  <meta charset=""utf-8"">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background-color: #059669; padding: 24px; text-align: center; color: #ffffff; }}
    .content {{ padding: 32px 24px; text-align: right; line-height: 1.6; }}
    .alert-box {{ background-color: #ecfdf5; border-right: 4px solid #059669; padding: 14px; border-radius: 8px; margin: 18px 0; font-size: 14px; color: #065f46; }}
    .footer {{ padding: 20px 24px; background-color: #f8fafc; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class=""container"">
    <div class=""header"">
      <h1 style=""margin:0;font-size:22px;font-weight:800;"">WatsStore | تحديث أمان الحساب</h1>
    </div>
    <div class=""content"">
      <p style=""font-size:16px;margin-top:0;"">مرحباً <strong>{ownerName}</strong>،</p>
      <div class=""alert-box"">
        تم تغيير كلمة المرور لحساب متجرك <strong>{storeName}</strong> بنجاح في {dateStr}.
      </div>
      <p style=""font-size:14px;color:#475569;"">لأسباب أمنية، تم إنهاء جميع الجلسات القديمة المسجلة للمتجر. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
      <p style=""font-size:13px;color:#dc2626;"">إذا لم تكن أنت من قام بهذا الإجراء، يرجى التواصل فوراً مع الدعم الفني لإيقاف الحساب وحمايته.</p>
    </div>
    <div class=""footer"">
      &copy; {DateTime.UtcNow.Year} WatsStore by Masar Tech. جميع الحقوق محفوظة.
    </div>
  </div>
</body>
</html>";

            var plainText = $"مرحباً {ownerName}، تم تغيير كلمة المرور لحساب متجرك {storeName} في {dateStr}. تم تسجيل الخروج من الجلسات السابقة.";
            return (subject, html, plainText);
        }
    }
}
