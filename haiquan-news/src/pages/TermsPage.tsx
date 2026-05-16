import React from 'react';
export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-[860px] px-4 py-10 md:py-16">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <p className="text-[12px] font-bold text-[#0059b2] uppercase tracking-widest mb-2">Pháp lý</p>
        <h1 className="text-[32px] md:text-[40px] font-['Playfair_Display',serif] font-black text-[#002060] leading-tight">
          Điều khoản sử dụng
        </h1>
        <p className="text-[14px] text-gray-500 mt-3">
          Cập nhật lần cuối: ngày 27 tháng 11 năm 2025 &nbsp;·&nbsp; Báo Hải Quân Việt Nam - SROV
        </p>
      </div>

      <div className="prose prose-lg max-w-none text-[#333] leading-relaxed space-y-8 text-[15px]">

        <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl text-[13px] text-amber-900">
          <strong>Lưu ý quan trọng:</strong> Đây là website roleplay milisim (giả lập quân đội) phục vụ cộng đồng SROV, không có mối liên hệ nào với Quân đội Nhân dân Việt Nam, Nước Cộng hòa xã hội chủ nghĩa Việt Nam, Đảng Cộng sản Việt Nam hoặc bất kỳ cơ quan nhà nước, tổ chức chính trị nào.
        </div>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">1. Chấp thuận điều khoản</h2>
          <p>
            Bằng cách truy cập và sử dụng website Báo Hải Quân Việt Nam - SROV ("Website"), bạn đồng ý chịu ràng buộc bởi các Điều khoản sử dụng này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng Website.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">2. Mục đích sử dụng</h2>
          <p>Website được tạo ra với mục đích:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Phục vụ hoạt động roleplay milisim trong cộng đồng SROV (Special Roleplay Operation Vietnam)</li>
            <li>Đăng tải tin tức, bài viết, nội dung đa phương tiện trong khuôn khổ trò chơi nhập vai quân sự</li>
            <li>Tạo không gian sáng tạo, học hỏi cho các thành viên cộng đồng</li>
            <li>Không nhằm mục đích thương mại, tuyên truyền chính trị thực tế hay gây hiểu lầm về các tổ chức thực tế</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">3. Nội dung được phép</h2>
          <p>Người dùng và quản trị viên chỉ được đăng tải nội dung:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Phù hợp với chủ đề roleplay milisim Hải quân Việt Nam trong khuôn khổ cộng đồng SROV</li>
            <li>Không vi phạm pháp luật Việt Nam và quốc tế</li>
            <li>Không xúc phạm, bôi nhọ danh dự cá nhân, tổ chức</li>
            <li>Không chứa nội dung khiêu dâm, bạo lực thái quá, hoặc kích động thù địch</li>
            <li>Không giả mạo thông tin chính thức của cơ quan nhà nước</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">4. Quyền sở hữu trí tuệ</h2>
          <p>
            Toàn bộ nội dung trên Website bao gồm văn bản, hình ảnh, logo, giao diện được thiết kế riêng cho cộng đồng SROV và thuộc quyền sở hữu của Ban biên tập Báo Hải Quân Việt Nam - SROV. Nghiêm cấm sao chép, phân phối lại nội dung mà không có sự cho phép bằng văn bản.
          </p>
          <p className="mt-3">
            Một số hình ảnh minh họa có thể được lấy từ các nguồn công khai hợp pháp. Ban biên tập luôn cố gắng ghi rõ nguồn khi sử dụng. Nếu bạn là chủ sở hữu của nội dung nào đó và muốn yêu cầu gỡ bỏ, vui lòng liên hệ với chúng tôi.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">5. Giới hạn trách nhiệm</h2>
          <p>
            Website được cung cấp theo nguyên tắc "hiện trạng" (as-is). Ban quản trị SROV không chịu trách nhiệm về:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Tính chính xác, đầy đủ của nội dung (do đây là nội dung sáng tạo roleplay, không phải tin tức thực tế)</li>
            <li>Gián đoạn dịch vụ do lỗi kỹ thuật, bảo trì hệ thống</li>
            <li>Thiệt hại phát sinh từ việc sử dụng hoặc không thể sử dụng Website</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">6. Tài khoản quản trị</h2>
          <p>
            Tài khoản quản trị viên (Admin) trên Website chỉ được cấp cho thành viên đã được Ban chỉ huy SROV phê duyệt. Quản trị viên có trách nhiệm:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Bảo mật thông tin tài khoản, không chia sẻ mật khẩu</li>
            <li>Chỉ đăng tải nội dung phù hợp với quy định của cộng đồng SROV</li>
            <li>Chịu trách nhiệm về nội dung mà mình đăng tải</li>
            <li>Báo cáo ngay khi phát hiện tài khoản bị xâm phạm</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">7. Thay đổi điều khoản</h2>
          <p>
            Ban quản trị SROV có quyền thay đổi, cập nhật các Điều khoản sử dụng này bất kỳ lúc nào mà không cần thông báo trước. Việc tiếp tục sử dụng Website sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">8. Liên hệ</h2>
          <p>Nếu có câu hỏi về Điều khoản sử dụng, vui lòng liên hệ:</p>
          <ul className="list-none pl-0 space-y-1.5 mt-3">
            <li><strong>Email:</strong> <a href="mailto:hoaidung2806le@gmail.com" className="text-[#0059b2] hover:underline">hoaidung2806le@gmail.com</a></li>
            <li><strong>Email:</strong> <a href="mailto:pt84092423@gmail.com" className="text-[#0059b2] hover:underline">pt84092423@gmail.com</a></li>
            <li><strong>Tổng biên tập:</strong> Thượng sĩ Uhqwekh</li>
          </ul>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
        <a href="/" className="text-[13px] text-[#0059b2] font-bold hover:underline flex items-center gap-1.5">
          ← Về trang chủ
        </a>
        <a href="/chinh-sach-bao-mat" className="text-[13px] text-[#0059b2] font-bold hover:underline flex items-center gap-1.5">
          Chính sách bảo mật →
        </a>
      </div>
    </div>
  );
}
