export const ORDER_STAGES = ['Pending','Confirmed','Preparing','Shipped','Delivered'] as const;
export const terminalOrder = (status?: string) => ['Delivered','Cancelled','Rejected'].includes(status || '');
export function orderLabel(status: string, english = false): string {
  const names: Record<string,[string,string]> = {
    Pending:['تم استلام طلبك','Order received'], Confirmed:['المتجر أكّد طلبك','Your order was confirmed'],
    Preparing:['طلبك بيتجهّز','Your order is being prepared'], Shipped:['طلبك اتشحن','Your order has shipped'],
    Delivered:['طلبك اتسلّم','Your order was delivered'], Cancelled:['طلبك اتلغى','Your order was cancelled'],
    Rejected:['المتجر رفض الطلب','Your order was rejected'], PaymentVerified:['تم التحقق من الدفع','Payment verified'],
    Unpaid:['غير مدفوع','Unpaid'], AwaitingVerification:['التحويل بانتظار مراجعة المتجر','Transfer awaiting verification'],
    Paid:['تم الدفع','Paid'], cod:['الدفع عند الاستلام','Cash on delivery'], instapay:['إنستاباي','InstaPay'], wallet:['محفظة إلكترونية','Mobile wallet'],
  };
  return names[status]?.[english ? 1 : 0] || status;
}
