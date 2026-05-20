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
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">1. Giới thiệu và phạm vi áp dụng</h2>
          <p>
            Chính sách bảo mật này ("Chính sách") áp dụng cho tất cả người dùng truy cập Website Báo Hải Quân Việt Nam - SROV, bao gồm độc giả công khai và quản trị viên có tài khoản. Chính sách mô tả cách chúng tôi thu thập, xử lý, lưu trữ và bảo vệ thông tin cá nhân theo quy định pháp luật Việt Nam và các tiêu chuẩn quốc tế về bảo vệ dữ liệu.
          </p>
          <p className="mt-3">
            Website không yêu cầu người dùng thông thường (độc giả) tạo tài khoản hay cung cấp thông tin cá nhân để đọc nội dung. Chính sách này chủ yếu liên quan đến dữ liệu kỹ thuật được tự động thu thập và thông tin tài khoản của quản trị viên.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">2. Thông tin chúng tôi thu thập</h2>
          <p>Website này là nền tảng đọc tin tức, do đó chúng tôi <strong>không yêu cầu đăng ký tài khoản</strong> từ độc giả. Các thông tin có thể được thu thập tự động bao gồm:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Dữ liệu sử dụng:</strong> Số lượt xem bài viết (tổng hợp, không định danh cá nhân)</li>
            <li><strong>Địa chỉ IP:</strong> Được ghi nhận tạm thời nhằm mục đích bảo mật hệ thống và phát hiện truy cập bất thường</li>
            <li><strong>Cookie kỹ thuật:</strong> Cookie cần thiết cho hoạt động của Website (phiên làm việc, tùy chọn giao diện)</li>
            <li><strong>Thông tin trình duyệt:</strong> Loại trình duyệt, hệ điều hành — dùng để tối ưu hóa hiển thị</li>
            <li><strong>Dữ liệu điều hướng:</strong> Các trang đã truy cập, thời lượng, trang giới thiệu (referrer) — nhằm cải thiện trải nghiệm người dùng</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">3. Thông tin tài khoản quản trị</h2>
          <p>Đối với quản trị viên có tài khoản trên hệ thống, chúng tôi lưu trữ:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Tên đăng nhập và mật khẩu (được mã hóa một chiều bằng SHA-256, không thể khôi phục nguyên bản)</li>
            <li>Tên hiển thị và bút danh trong cộng đồng SROV</li>
            <li>Vai trò và cấp quyền (HADMIN/ADMIN/EDITOR)</li>
            <li>Ảnh đại diện (nếu được cung cấp, lưu trên dịch vụ ImgBB)</li>
            <li>Nhật ký hoạt động (audit log): ghi nhận các thao tác quan trọng như đăng nhập, đăng bài, xóa bài, thay đổi cấu hình để đảm bảo trách nhiệm giải trình</li>
            <li>Thời điểm tạo tài khoản và lần đăng nhập cuối cùng</li>
          </ul>
          <p className="mt-3">Chúng tôi <strong>không bao giờ chia sẻ</strong> thông tin tài khoản quản trị viên với bên thứ ba không được ủy quyền.</p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">4. Mục đích thu thập và xử lý thông tin</h2>
          <p>Thông tin được thu thập dùng để:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Vận hành và cải thiện hiệu năng Website</li>
            <li>Bảo mật hệ thống, phát hiện và ngăn chặn truy cập trái phép</li>
            <li>Thống kê lượt xem bài viết nhằm tối ưu nội dung</li>
            <li>Hỗ trợ quản trị viên đăng nhập và quản lý nội dung</li>
            <li>Kiểm tra tính hợp lệ của các thao tác khi có sự cố</li>
            <li>Phân tích xu hướng sử dụng để cải thiện giao diện và trải nghiệm</li>
          </ul>
          <p className="mt-3">Chúng tôi <strong>không sử dụng thông tin</strong> cho mục đích quảng cáo thương mại, bán dữ liệu hay phân tích dữ liệu cá nhân vì lợi ích tài chính.</p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">5. Cơ sở pháp lý xử lý dữ liệu</h2>
          <p>Chúng tôi xử lý dữ liệu cá nhân dựa trên các căn cứ pháp lý sau:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Sự đồng ý:</strong> Khi quản trị viên tạo tài khoản, họ đồng ý cho phép lưu trữ thông tin cần thiết để vận hành tài khoản</li>
            <li><strong>Lợi ích hợp pháp:</strong> Thu thập dữ liệu kỹ thuật tối thiểu để đảm bảo bảo mật và vận hành ổn định Website</li>
            <li><strong>Thực hiện hợp đồng:</strong> Lưu trữ thông tin cần thiết để cung cấp dịch vụ quản lý nội dung cho quản trị viên</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">6. Chia sẻ thông tin với bên thứ ba</h2>
          <p>
            Chúng tôi <strong>không bán, cho thuê hay trao đổi</strong> thông tin cá nhân của người dùng với bên thứ ba vì mục đích thương mại. Thông tin chỉ được chia sẻ trong các trường hợp sau:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Nhà cung cấp dịch vụ:</strong> Supabase (cơ sở dữ liệu), ImgBB (lưu trữ ảnh) cần truy cập dữ liệu để cung cấp dịch vụ cho chúng tôi</li>
            <li><strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu hợp pháp từ cơ quan có thẩm quyền theo quy định pháp luật Việt Nam</li>
            <li><strong>Bảo vệ quyền lợi:</strong> Trong trường hợp cần thiết để bảo vệ quyền lợi, tài sản hoặc an toàn của Ban quản trị, thành viên cộng đồng hoặc cộng đồng nói chung</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">7. Dịch vụ bên thứ ba</h2>
          <p>Website sử dụng một số dịch vụ bên thứ ba:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Supabase:</strong> Hệ thống cơ sở dữ liệu và lưu trữ đám mây. Dữ liệu được lưu trữ trên máy chủ của Supabase theo tiêu chuẩn SOC2 và tuân thủ GDPR. Xem chính sách tại supabase.com/privacy</li>
            <li><strong>ImgBB:</strong> Dịch vụ lưu trữ ảnh miễn phí. Hình ảnh tải lên sẽ được lưu trên máy chủ ImgBB. Xem chính sách tại imgbb.com/privacy</li>
            <li><strong>Google Fonts:</strong> Font chữ được tải từ máy chủ Google — có thể ghi nhận request từ trình duyệt của bạn theo chính sách của Google</li>
            <li><strong>YouTube / TikTok / SoundCloud:</strong> Nội dung nhúng từ các nền tảng này tuân theo chính sách bảo mật riêng của họ. Khi xem nội dung nhúng, các nền tảng này có thể thu thập dữ liệu của bạn</li>
            <li><strong>Replit:</strong> Hạ tầng hosting Website sử dụng dịch vụ Replit. Xem chính sách tại replit.com/privacy</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">8. Cookie và công nghệ theo dõi</h2>
          <p>
            Website sử dụng cookie tối thiểu cần thiết để hoạt động. Chúng tôi <strong>không dùng cookie theo dõi quảng cáo</strong> hay cookie bên thứ ba cho mục đích phân tích thương mại.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Cookie phiên làm việc (Session):</strong> Lưu trạng thái đăng nhập quản trị viên trong localStorage — tự động xóa khi đăng xuất</li>
            <li><strong>Cookie cache:</strong> Lưu dữ liệu trang chủ tạm thời để tăng tốc tải trang (localStorage, TTL 5 phút)</li>
            <li><strong>Cookie tùy chọn:</strong> Ghi nhớ tùy chọn giao diện nếu có (localStorage)</li>
          </ul>
          <p className="mt-3">
            Bạn có thể xóa cookie và localStorage bằng cách xóa bộ nhớ trình duyệt. Tuy nhiên, việc này sẽ đăng xuất tài khoản quản trị (nếu có) và xóa cache trang chủ.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">9. Bảo mật dữ liệu</h2>
          <p>Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Kết nối HTTPS/TLS mã hóa toàn bộ lưu lượng truyền tải giữa trình duyệt và máy chủ</li>
            <li>Mật khẩu quản trị viên được băm (hash) SHA-256 — không lưu trữ mật khẩu gốc dưới bất kỳ hình thức nào</li>
            <li>Phân quyền truy cập nghiêm ngặt: HADMIN / ADMIN / EDITOR với quyền hạn tách biệt rõ ràng</li>
            <li>Nhật ký kiểm tra (audit log) ghi nhận mọi thao tác nhạy cảm theo thời gian thực</li>
            <li>Hệ thống duyệt nội dung (approval workflow) ngăn chặn đăng tải trái phép</li>
            <li>Giới hạn tốc độ truy cập (rate limiting) để ngăn tấn công brute-force</li>
            <li>Khóa tài khoản tự động sau nhiều lần đăng nhập sai</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">10. Thời gian lưu trữ dữ liệu</h2>
          <p>Chúng tôi lưu trữ dữ liệu theo các thời hạn sau:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Nhật ký hoạt động (audit log):</strong> Lưu tối đa 12 tháng, sau đó tự động xóa hoặc lưu trữ dạng ẩn danh</li>
            <li><strong>Địa chỉ IP:</strong> Lưu tối đa 30 ngày cho mục đích bảo mật, sau đó xóa</li>
            <li><strong>Thông tin tài khoản quản trị:</strong> Lưu trong suốt thời gian tài khoản còn hoạt động. Xóa trong vòng 30 ngày sau khi tài khoản bị xóa theo yêu cầu</li>
            <li><strong>Nội dung bài đăng:</strong> Lưu vĩnh viễn trừ khi có yêu cầu xóa hợp lệ</li>
            <li><strong>Dữ liệu thống kê:</strong> Lưu dưới dạng tổng hợp ẩn danh vô thời hạn</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">11. Quyền của người dùng</h2>
          <p>Nếu bạn là quản trị viên có tài khoản trên hệ thống, bạn có các quyền sau:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Quyền truy cập:</strong> Yêu cầu xem toàn bộ thông tin cá nhân chúng tôi lưu trữ về bạn</li>
            <li><strong>Quyền chỉnh sửa:</strong> Yêu cầu cập nhật thông tin không chính xác hoặc lỗi thời</li>
            <li><strong>Quyền xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu cá nhân liên quan (trừ nhật ký bắt buộc theo pháp luật)</li>
            <li><strong>Quyền hạn chế:</strong> Yêu cầu tạm ngừng xử lý dữ liệu của bạn trong thời gian điều tra tranh chấp</li>
            <li><strong>Quyền di chuyển:</strong> Nhận bản sao dữ liệu cá nhân ở định dạng có thể đọc được bằng máy</li>
            <li><strong>Quyền phản đối:</strong> Phản đối việc xử lý dữ liệu của bạn vì những lý do chính đáng</li>
            <li><strong>Quyền thay đổi mật khẩu:</strong> Thay đổi mật khẩu bất kỳ lúc nào qua trang quản lý tài khoản</li>
          </ul>
          <p className="mt-3">Để thực hiện các quyền trên, liên hệ với HADMIN hoặc gửi email cho chúng tôi. Chúng tôi sẽ phản hồi trong vòng 30 ngày.</p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">12. Bảo vệ trẻ em</h2>
          <p>
            Website không có nội dung dành riêng cho trẻ em và không cố ý thu thập thông tin cá nhân của người dưới 13 tuổi. Nếu chúng tôi phát hiện đã vô tình thu thập thông tin của trẻ em, chúng tôi sẽ xóa ngay lập tức.
          </p>
          <p className="mt-3">
            Phụ huynh hoặc người giám hộ phát hiện trẻ em cung cấp thông tin cá nhân cho Website mà không có sự đồng ý, vui lòng liên hệ ngay với chúng tôi để xử lý.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">13. Truyền dữ liệu xuyên biên giới</h2>
          <p>
            Do sử dụng các dịch vụ đám mây quốc tế (Supabase, Replit, ImgBB), dữ liệu của bạn có thể được lưu trữ và xử lý tại các máy chủ bên ngoài lãnh thổ Việt Nam. Các nhà cung cấp này đều tuân thủ các tiêu chuẩn bảo mật quốc tế và có cơ chế bảo vệ dữ liệu phù hợp.
          </p>
          <p className="mt-3">
            Bằng cách sử dụng Website, bạn đồng ý cho phép truyền dữ liệu xuyên biên giới này. Nếu bạn không đồng ý, vui lòng không sử dụng Website hoặc tạo tài khoản quản trị.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">14. Thông báo vi phạm dữ liệu</h2>
          <p>
            Trong trường hợp xảy ra vi phạm bảo mật dữ liệu có thể ảnh hưởng đến quyền lợi của người dùng, chúng tôi cam kết:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Thông báo cho các quản trị viên bị ảnh hưởng trong vòng 72 giờ kể từ khi phát hiện</li>
            <li>Cung cấp thông tin rõ ràng về bản chất vi phạm, dữ liệu bị ảnh hưởng và các biện pháp xử lý</li>
            <li>Thực hiện ngay các biện pháp khắc phục để ngăn chặn thiệt hại tiếp theo</li>
            <li>Ghi nhận và điều tra nguyên nhân để phòng ngừa trong tương lai</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">15. Nhật ký kiểm tra (Audit Log)</h2>
          <p>
            Hệ thống ghi nhật ký kiểm tra tự động các hành động quan trọng của quản trị viên bao gồm:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Đăng nhập thành công và thất bại (với thời gian và địa chỉ IP)</li>
            <li>Tạo, chỉnh sửa, xóa bài đăng</li>
            <li>Phê duyệt hoặc từ chối bài đăng</li>
            <li>Thay đổi cài đặt hệ thống</li>
            <li>Tạo, chỉnh sửa, xóa tài khoản người dùng</li>
            <li>Thay đổi mật khẩu và thông tin tài khoản</li>
          </ul>
          <p className="mt-3">
            Nhật ký kiểm tra không thể xóa hoặc chỉnh sửa bởi bất kỳ cấp độ quản trị nào, nhằm đảm bảo tính toàn vẹn của hồ sơ hoạt động. Chỉ HADMIN được xem toàn bộ nhật ký. Quản trị viên chỉ xem được nhật ký hành động của chính mình.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">16. Dữ liệu nặc danh và thống kê</h2>
          <p>
            Chúng tôi có thể tổng hợp và ẩn danh hóa dữ liệu sử dụng để tạo ra các báo cáo thống kê về hoạt động Website. Dữ liệu thống kê ẩn danh này không chứa thông tin có thể nhận dạng cá nhân và có thể được chia sẻ công khai hoặc dùng để cải thiện dịch vụ.
          </p>
          <p className="mt-3">
            Ví dụ: "Bài viết X đạt 1.500 lượt đọc trong tháng 11/2025" — thông tin này không tiết lộ ai đã đọc bài viết đó.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">17. Quyền riêng tư trong cộng đồng roleplay</h2>
          <p>
            Trong khuôn khổ roleplay SROV, thành viên sử dụng tên nhân vật và danh tính hư cấu. Chúng tôi cam kết:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Không liên kết tên nhân vật roleplay với danh tính thực của thành viên mà không có sự đồng ý</li>
            <li>Không tiết lộ thông tin về mối quan hệ giữa tài khoản roleplay và người thực tế</li>
            <li>Bảo vệ quyền duy trì danh tính hư cấu riêng biệt với cuộc sống thực của thành viên</li>
            <li>Tôn trọng sự lựa chọn của thành viên về mức độ thông tin cá nhân được chia sẻ trong cộng đồng</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">18. Quản lý và xóa tài khoản</h2>
          <p>Khi tài khoản quản trị viên bị xóa hoặc vô hiệu hóa, chúng tôi xử lý dữ liệu như sau:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Thông tin đăng nhập (tên tài khoản, mật khẩu băm) bị xóa ngay lập tức</li>
            <li>Thông tin hiển thị (tên, ảnh đại diện) bị xóa trong vòng 30 ngày</li>
            <li>Nội dung bài đăng do tài khoản này tạo ra có thể được giữ lại nhưng sẽ hiển thị tên tác giả là "Biên tập viên SROV" hoặc ẩn danh</li>
            <li>Nhật ký kiểm tra liên quan đến tài khoản được lưu giữ theo quy định lưu trữ nhật ký (tối đa 12 tháng)</li>
          </ul>
          <p className="mt-3">Để yêu cầu xóa tài khoản, liên hệ HADMIN hoặc gửi yêu cầu qua email. Yêu cầu sẽ được xử lý trong vòng 7 ngày làm việc.</p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">19. Tuân thủ pháp luật</h2>
          <p>
            Chính sách bảo mật này được xây dựng có tham khảo các quy định sau:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Luật An toàn thông tin mạng Việt Nam số 86/2015/QH13</li>
            <li>Luật An ninh mạng Việt Nam số 24/2018/QH14</li>
            <li>Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân</li>
            <li>Quy định GDPR của Liên minh Châu Âu (áp dụng như tiêu chuẩn tham khảo)</li>
          </ul>
          <p className="mt-3">
            Nếu pháp luật yêu cầu cung cấp thông tin người dùng, chúng tôi sẽ chỉ cung cấp thông tin tối thiểu cần thiết theo yêu cầu hợp pháp và thông báo cho người dùng bị ảnh hưởng nếu pháp luật cho phép.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">20. Thay đổi chính sách</h2>
          <p>
            Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian để phản ánh thay đổi trong hoạt động của Website hoặc yêu cầu pháp lý. Mọi thay đổi sẽ được đăng trên trang này với ngày cập nhật mới.
          </p>
          <p className="mt-3">
            Đối với các thay đổi quan trọng, chúng tôi sẽ thông báo cho quản trị viên qua email đăng ký ít nhất 7 ngày trước khi thay đổi có hiệu lực. Việc tiếp tục sử dụng Website sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận phiên bản chính sách mới.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">21. Liên hệ về bảo mật</h2>
          <p>Mọi thắc mắc về Chính sách bảo mật hoặc yêu cầu thực hiện quyền của bạn, vui lòng liên hệ:</p>
          <ul className="list-none pl-0 space-y-1.5 mt-3">
            <li><strong>Email:</strong> <a href="mailto:hoaidung2806le@gmail.com" className="text-[#0059b2] hover:underline">hoaidung2806le@gmail.com</a></li>
            <li><strong>Email:</strong> <a href="mailto:pt84092423@gmail.com" className="text-[#0059b2] hover:underline">pt84092423@gmail.com</a></li>
            <li><strong>Tổng biên tập:</strong> Thượng sĩ Uhqwekh</li>
            <li><strong>Trụ sở:</strong> Quân cảng Cam Ranh, Khánh Hoà (trong khuôn khổ roleplay SROV)</li>
          </ul>
          <p className="mt-3">
            Chúng tôi cam kết phản hồi mọi yêu cầu liên quan đến quyền riêng tư và bảo mật dữ liệu trong vòng <strong>30 ngày làm việc</strong> kể từ ngày nhận được yêu cầu.
          </p>
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
