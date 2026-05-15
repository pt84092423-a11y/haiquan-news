export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-[860px] px-4 py-10 md:py-16">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <p className="text-[12px] font-bold text-[#0059b2] uppercase tracking-widest mb-2">Pháp lý</p>
        <h1 className="text-[32px] md:text-[40px] font-['Playfair_Display',serif] font-black text-[#002060] leading-tight">
          Chính sách bảo mật
        </h1>
        <p className="text-[14px] text-gray-500 mt-3">
          Cập nhật lần cuối: ngày 27 tháng 11 năm 2025 &nbsp;·&nbsp; Báo Hải Quân Việt Nam - SROV
        </p>
      </div>

      <div className="prose prose-lg max-w-none text-[#333] leading-relaxed space-y-8 text-[15px]">

        <div className="p-4 bg-blue-50 border-l-4 border-[#0059b2] rounded-r-xl text-[13px] text-[#002060]">
          <strong>Cam kết của chúng tôi:</strong> Chúng tôi coi trọng quyền riêng tư của người dùng. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi sử dụng Website Báo Hải Quân Việt Nam - SROV.
        </div>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">1. Thông tin chúng tôi thu thập</h2>
          <p>Website này là nền tảng đọc tin tức, do đó chúng tôi <strong>không yêu cầu đăng ký tài khoản</strong> từ độc giả. Các thông tin có thể được thu thập tự động bao gồm:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Dữ liệu sử dụng:</strong> Số lượt xem bài viết (tổng hợp, không định danh cá nhân)</li>
            <li><strong>Địa chỉ IP:</strong> Được ghi nhận tạm thời nhằm mục đích bảo mật hệ thống và phát hiện truy cập bất thường</li>
            <li><strong>Cookie kỹ thuật:</strong> Cookie cần thiết cho hoạt động của website (phiên làm việc, tùy chọn giao diện)</li>
            <li><strong>Thông tin trình duyệt:</strong> Loại trình duyệt, hệ điều hành — dùng để tối ưu hóa hiển thị</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">2. Thông tin tài khoản quản trị</h2>
          <p>Đối với quản trị viên có tài khoản trên hệ thống, chúng tôi lưu trữ:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Tên đăng nhập và mật khẩu (được mã hóa một chiều bằng SHA-256, không thể khôi phục nguyên bản)</li>
            <li>Tên hiển thị, vai trò (HADMIN/ADMIN/EDITOR)</li>
            <li>Ảnh đại diện (nếu được cung cấp, lưu trên dịch vụ ImgBB)</li>
            <li>Nhật ký hoạt động (audit log): ghi nhận các thao tác quan trọng để đảm bảo trách nhiệm giải trình</li>
          </ul>
          <p className="mt-3">Chúng tôi <strong>không bao giờ chia sẻ</strong> thông tin tài khoản quản trị viên với bên thứ ba.</p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">3. Mục đích sử dụng thông tin</h2>
          <p>Thông tin được thu thập dùng để:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Vận hành và cải thiện hiệu năng Website</li>
            <li>Bảo mật hệ thống, phát hiện và ngăn chặn truy cập trái phép</li>
            <li>Thống kê lượt xem bài viết nhằm tối ưu nội dung</li>
            <li>Hỗ trợ quản trị viên đăng nhập và quản lý nội dung</li>
          </ul>
          <p className="mt-3">Chúng tôi <strong>không sử dụng thông tin</strong> cho mục đích quảng cáo thương mại hay phân tích dữ liệu cá nhân.</p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">4. Dịch vụ bên thứ ba</h2>
          <p>Website sử dụng một số dịch vụ bên thứ ba:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Supabase:</strong> Hệ thống cơ sở dữ liệu và lưu trữ. Dữ liệu được lưu trữ trên máy chủ của Supabase (tuân thủ GDPR)</li>
            <li><strong>ImgBB:</strong> Dịch vụ lưu trữ ảnh. Hình ảnh tải lên sẽ được lưu trên máy chủ ImgBB</li>
            <li><strong>Google Fonts:</strong> Font chữ — có thể ghi nhận request từ trình duyệt của bạn</li>
            <li><strong>YouTube / TikTok / SoundCloud:</strong> Nội dung nhúng từ các nền tảng này tuân theo chính sách bảo mật riêng của họ</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">5. Cookie</h2>
          <p>
            Website sử dụng cookie tối thiểu cần thiết để hoạt động. Chúng tôi <strong>không dùng cookie theo dõi quảng cáo</strong>. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng của website có thể không hoạt động đúng.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Cookie phiên làm việc (Session):</strong> Lưu trạng thái đăng nhập quản trị viên trong localStorage</li>
            <li><strong>Cookie tùy chọn:</strong> Ghi nhớ tùy chọn giao diện (nếu có)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">6. Bảo mật dữ liệu</h2>
          <p>Chúng tôi áp dụng các biện pháp bảo mật:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Kết nối HTTPS mã hóa toàn bộ lưu lượng truyền tải</li>
            <li>Mật khẩu quản trị viên được băm (hash) SHA-256 — không lưu trữ mật khẩu gốc</li>
            <li>Phân quyền truy cập: HADMIN / ADMIN / EDITOR với quyền hạn khác nhau</li>
            <li>Nhật ký kiểm tra (audit log) ghi nhận mọi thao tác nhạy cảm</li>
            <li>Hệ thống duyệt nội dung (approval workflow) trước khi xuất bản</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">7. Quyền của bạn</h2>
          <p>Nếu bạn là quản trị viên có tài khoản trên hệ thống, bạn có quyền:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Yêu cầu xem thông tin cá nhân chúng tôi lưu trữ về bạn</li>
            <li>Yêu cầu chỉnh sửa thông tin không chính xác</li>
            <li>Yêu cầu xóa tài khoản và dữ liệu liên quan</li>
            <li>Thay đổi mật khẩu bất kỳ lúc nào</li>
          </ul>
          <p className="mt-3">Để thực hiện các quyền trên, liên hệ với HADMIN hoặc gửi email cho chúng tôi.</p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">8. Thay đổi chính sách</h2>
          <p>
            Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được đăng trên trang này với ngày cập nhật mới. Việc tiếp tục sử dụng Website sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận chính sách mới.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">9. Liên hệ</h2>
          <p>Mọi thắc mắc về Chính sách bảo mật, vui lòng liên hệ:</p>
          <ul className="list-none pl-0 space-y-1.5 mt-3">
            <li><strong>Email:</strong> <a href="mailto:hoaidung2806le@gmail.com" className="text-[#0059b2] hover:underline">hoaidung2806le@gmail.com</a></li>
            <li><strong>Email:</strong> <a href="mailto:pt84092423@gmail.com" className="text-[#0059b2] hover:underline">pt84092423@gmail.com</a></li>
            <li><strong>Tổng biên tập:</strong> Thượng sĩ Uhqwekh</li>
            <li><strong>Trụ sở:</strong> Quân cảng Cam Ranh, Khánh Hoà (trong khuôn khổ roleplay SROV)</li>
          </ul>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
        <a href="/" className="text-[13px] text-[#0059b2] font-bold hover:underline flex items-center gap-1.5">
          ← Về trang chủ
        </a>
        <a href="/dieu-khoan" className="text-[13px] text-[#0059b2] font-bold hover:underline flex items-center gap-1.5">
          Điều khoản sử dụng →
        </a>
      </div>
    </div>
  );
}
