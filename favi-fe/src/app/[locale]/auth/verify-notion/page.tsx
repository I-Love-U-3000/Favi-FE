export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
      <h1 className="text-3xl font-bold mb-4">Xác minh Email</h1>
      <p className="text-gray-600 max-w-md">
        Chúng tôi đã gửi email xác minh đến địa chỉ của bạn. 
        Vui lòng kiểm tra hộp thư (hoặc thư mục Spam) và làm theo hướng dẫn để kích hoạt tài khoản.
      </p>
      <p className="mt-6 text-sm text-gray-500">
        Sau khi xác minh, bạn có thể <a href="/login" className="text-primary underline">đăng nhập</a> vào ứng dụng.
      </p>
    </div>
  );
}
