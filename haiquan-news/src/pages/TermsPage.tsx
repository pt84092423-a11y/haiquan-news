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
            Bằng cách truy cập và sử dụng website Báo Hải Quân Việt Nam - SROV ("Website"), bạn đồng ý chịu ràng buộc bởi các Điều khoản sử dụng này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng Website. Việc tiếp tục truy cập Website sau khi các Điều khoản này được cập nhật đồng nghĩa với việc bạn chấp nhận phiên bản mới nhất.
          </p>
          <p className="mt-3">
            Các Điều khoản sử dụng này cùng với Chính sách bảo mật tạo thành toàn bộ thỏa thuận giữa bạn và Ban quản trị SROV liên quan đến việc sử dụng Website. Không có thỏa thuận hay đại diện nào khác có giá trị pháp lý trừ khi được thể hiện bằng văn bản và có chữ ký của đại diện có thẩm quyền của Ban quản trị.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">2. Mục đích và phạm vi sử dụng</h2>
          <p>Website được tạo ra với mục đích:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Phục vụ hoạt động roleplay milisim trong cộng đồng SROV (Special Roleplay Operation Vietnam)</li>
            <li>Đăng tải tin tức, bài viết, nội dung đa phương tiện trong khuôn khổ trò chơi nhập vai quân sự</li>
            <li>Tạo không gian sáng tạo, học hỏi và giao lưu cho các thành viên cộng đồng</li>
            <li>Không nhằm mục đích thương mại, tuyên truyền chính trị thực tế hay gây hiểu lầm về các tổ chức thực tế</li>
            <li>Lưu trữ tài liệu lịch sử, kỷ yếu hoạt động của cộng đồng SROV theo thời gian</li>
          </ul>
          <p className="mt-3">
            Website chỉ phục vụ mục đích nội bộ trong phạm vi cộng đồng SROV. Mọi nội dung trên Website là sáng tạo hư cấu và không phản ánh thực tế quân sự, chính trị hay ngoại giao của Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">3. Nội dung được phép đăng tải</h2>
          <p>Người dùng và quản trị viên chỉ được đăng tải nội dung:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Phù hợp với chủ đề roleplay milisim Hải quân Việt Nam trong khuôn khổ cộng đồng SROV</li>
            <li>Không vi phạm pháp luật Việt Nam và pháp luật quốc tế áp dụng</li>
            <li>Không xúc phạm, bôi nhọ danh dự, nhân phẩm của cá nhân hoặc tổ chức</li>
            <li>Không chứa nội dung khiêu dâm, bạo lực thái quá, hoặc kích động thù địch</li>
            <li>Không giả mạo thông tin chính thức của cơ quan nhà nước hay tổ chức hợp pháp</li>
            <li>Không vi phạm quyền sở hữu trí tuệ, bản quyền của cá nhân hay tổ chức khác</li>
            <li>Không chứa mã độc, liên kết nguy hiểm hoặc nội dung có thể gây hại cho hệ thống</li>
            <li>Được trình bày rõ ràng là nội dung sáng tạo, hư cấu thuộc khuôn khổ roleplay SROV</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">4. Nội dung bị cấm</h2>
          <p>Nghiêm cấm đăng tải, chia sẻ hoặc truyền bá các nội dung:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Tuyên truyền chống phá Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam</li>
            <li>Kích động bạo lực, thù địch giữa các dân tộc, tôn giáo hoặc nhóm xã hội</li>
            <li>Thông tin cá nhân của người khác khi chưa được sự đồng ý</li>
            <li>Nội dung lừa đảo, phishing hoặc mạo danh cộng đồng SROV</li>
            <li>Spam, quảng cáo thương mại không được phép bởi Ban quản trị</li>
            <li>Nội dung vi phạm luật bản quyền mà không có giấy phép hoặc ngoại lệ hợp pháp</li>
            <li>Thông tin gây hiểu nhầm nghiêm trọng về tình hình thực tế quốc tế, quân sự hoặc chính trị</li>
          </ul>
          <p className="mt-3">Ban quản trị có quyền gỡ bỏ bất kỳ nội dung nào vi phạm quy định này mà không cần thông báo trước.</p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">5. Quyền sở hữu trí tuệ</h2>
          <p>
            Toàn bộ nội dung trên Website bao gồm văn bản, hình ảnh, logo, giao diện được thiết kế riêng cho cộng đồng SROV và thuộc quyền sở hữu của Ban biên tập Báo Hải Quân Việt Nam - SROV. Nghiêm cấm sao chép, phân phối lại nội dung mà không có sự cho phép bằng văn bản.
          </p>
          <p className="mt-3">
            Một số hình ảnh minh họa có thể được lấy từ các nguồn công khai hợp pháp. Ban biên tập luôn cố gắng ghi rõ nguồn khi sử dụng. Nếu bạn là chủ sở hữu của nội dung nào đó và muốn yêu cầu gỡ bỏ, vui lòng liên hệ với chúng tôi trong vòng 30 ngày kể từ khi nội dung được đăng tải.
          </p>
          <p className="mt-3">
            Khi đăng tải nội dung lên Website, bạn cấp cho Ban quản trị SROV quyền sử dụng, tái sử dụng, lưu trữ và hiển thị nội dung đó trong khuôn khổ hoạt động của Website và cộng đồng SROV. Quyền này không độc quyền và bạn vẫn giữ toàn bộ quyền tác giả gốc.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">6. Tài khoản quản trị</h2>
          <p>
            Tài khoản quản trị viên (Admin) trên Website chỉ được cấp cho thành viên đã được Ban chỉ huy SROV phê duyệt. Quản trị viên có trách nhiệm:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Bảo mật thông tin tài khoản, không chia sẻ mật khẩu dưới bất kỳ hình thức nào</li>
            <li>Chỉ đăng tải nội dung phù hợp với quy định của cộng đồng SROV và các Điều khoản này</li>
            <li>Chịu hoàn toàn trách nhiệm về nội dung mà mình đăng tải hoặc chỉnh sửa</li>
            <li>Báo cáo ngay cho HADMIN khi phát hiện tài khoản bị xâm phạm hoặc nghi ngờ bị xâm phạm</li>
            <li>Không sử dụng tài khoản cho mục đích cá nhân ngoài phạm vi công việc được giao</li>
            <li>Tuân thủ quy trình duyệt nội dung (approval workflow) theo phân quyền đã được cấp</li>
          </ul>
          <p className="mt-3">
            Ban quản trị có quyền thu hồi, tạm khóa tài khoản bất kỳ lúc nào nếu phát hiện vi phạm mà không cần giải thích thêm. Mọi hành vi gian lận tài khoản sẽ bị xử lý theo quy chế nội bộ của cộng đồng SROV.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">7. Hệ thống phân quyền</h2>
          <p>Website vận hành theo hệ thống phân quyền ba cấp:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>HADMIN (Tổng quản trị):</strong> Quyền cao nhất, quản lý toàn bộ hệ thống, cấp phát và thu hồi tài khoản, cấu hình hệ thống</li>
            <li><strong>ADMIN (Quản trị):</strong> Quản lý nội dung, phê duyệt bài đăng, quản lý danh mục và cài đặt giao diện</li>
            <li><strong>EDITOR (Biên tập viên):</strong> Soạn thảo, chỉnh sửa bài viết; nội dung phải qua phê duyệt trước khi xuất bản</li>
          </ul>
          <p className="mt-3">
            Mỗi cấp độ chỉ được thực hiện các thao tác trong phạm vi quyền hạn được cấp. Mọi hành vi cố tình vượt quyền hạn đều bị ghi lại trong nhật ký hệ thống và có thể dẫn đến đình chỉ tài khoản.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">8. Quy trình xuất bản nội dung</h2>
          <p>
            Mọi nội dung trước khi xuất bản công khai đều phải trải qua quy trình kiểm duyệt:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Biên tập viên (EDITOR) soạn thảo và gửi bài để phê duyệt</li>
            <li>Quản trị (ADMIN) hoặc Tổng quản trị (HADMIN) xem xét và phê duyệt hoặc từ chối</li>
            <li>Bài được phê duyệt mới hiển thị công khai trên Website</li>
            <li>Bài bị từ chối sẽ được trả về kèm lý do để chỉnh sửa</li>
          </ul>
          <p className="mt-3">
            Nội dung sau khi xuất bản vẫn có thể bị gỡ bỏ hoặc chỉnh sửa bởi ADMIN/HADMIN nếu phát hiện vi phạm hoặc thông tin không chính xác trong khuôn khổ roleplay.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">9. Liên kết ngoài và nội dung nhúng</h2>
          <p>
            Website có thể chứa các liên kết đến các website bên ngoài hoặc nội dung nhúng từ YouTube, TikTok, SoundCloud và các nền tảng khác. Ban quản trị SROV không kiểm soát và không chịu trách nhiệm về nội dung, chính sách bảo mật hay hoạt động của các website bên thứ ba này.
          </p>
          <p className="mt-3">
            Việc truy cập các liên kết ngoài là hoàn toàn tự nguyện và rủi ro thuộc về người dùng. Chúng tôi khuyến nghị người dùng đọc kỹ điều khoản và chính sách bảo mật của từng dịch vụ bên thứ ba trước khi sử dụng.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">10. Giới hạn trách nhiệm</h2>
          <p>
            Website được cung cấp theo nguyên tắc "hiện trạng" (as-is). Ban quản trị SROV không chịu trách nhiệm về:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Tính chính xác, đầy đủ của nội dung (do đây là nội dung sáng tạo roleplay, không phải tin tức thực tế)</li>
            <li>Gián đoạn dịch vụ do lỗi kỹ thuật, bảo trì hệ thống hoặc sự cố ngoài tầm kiểm soát</li>
            <li>Thiệt hại trực tiếp hoặc gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng Website</li>
            <li>Mất mát dữ liệu do sự cố kỹ thuật không lường trước</li>
            <li>Hành vi của người dùng thứ ba khi sử dụng Website</li>
            <li>Nội dung do bên thứ ba đăng tải trước khi được kiểm duyệt và gỡ bỏ</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">11. Tuyên bố miễn trừ về tính xác thực</h2>
          <p>
            Tất cả nội dung trên Website, bao gồm tin tức, bài phân tích, hình ảnh, video và âm thanh, đều là nội dung <strong>sáng tạo hư cấu</strong> phục vụ mục đích roleplay trong cộng đồng SROV. Bất kỳ sự trùng hợp với sự kiện, nhân vật, địa điểm hay tổ chức thực tế đều là ngẫu nhiên.
          </p>
          <p className="mt-3">
            Website không đại diện, không liên kết và không được ủy quyền bởi Quân chủng Hải quân Nhân dân Việt Nam, Bộ Quốc phòng Việt Nam, Đảng Cộng sản Việt Nam hay bất kỳ cơ quan nhà nước nào của Cộng hòa xã hội chủ nghĩa Việt Nam.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">12. Quyền riêng tư của thành viên cộng đồng</h2>
          <p>
            Thông tin cá nhân của thành viên trong cộng đồng SROV được bảo mật tuyệt đối. Ban quản trị cam kết:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Không tiết lộ thông tin cá nhân (tên thật, địa chỉ, số điện thoại) của thành viên cho bên thứ ba</li>
            <li>Không sử dụng thông tin thành viên cho mục đích thương mại</li>
            <li>Cho phép thành viên yêu cầu xóa thông tin cá nhân khỏi hệ thống</li>
            <li>Bảo vệ danh tính thực của thành viên trong mọi tình huống trừ khi có yêu cầu pháp lý bắt buộc</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">13. Ứng xử cộng đồng</h2>
          <p>
            Mọi thành viên và quản trị viên khi tham gia hoạt động liên quan đến Website đều phải tuân thủ quy tắc ứng xử cộng đồng SROV:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Tôn trọng lẫn nhau, không có hành vi quấy rối, phân biệt đối xử hay bắt nạt</li>
            <li>Giải quyết mâu thuẫn nội bộ qua kênh chính thức của Ban chỉ huy SROV</li>
            <li>Không mang tranh chấp cá nhân lên Website hoặc các nền tảng công khai</li>
            <li>Tôn trọng quyết định của Ban quản trị và Ban chỉ huy SROV</li>
            <li>Đóng góp xây dựng cộng đồng một cách tích cực và có trách nhiệm</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">14. Xử lý vi phạm</h2>
          <p>Khi phát hiện vi phạm Điều khoản sử dụng, Ban quản trị có thể áp dụng các biện pháp:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Cảnh cáo:</strong> Thông báo bằng văn bản về vi phạm và yêu cầu chấm dứt</li>
            <li><strong>Xóa nội dung:</strong> Gỡ bỏ nội dung vi phạm mà không cần thông báo trước</li>
            <li><strong>Tạm khóa tài khoản:</strong> Khóa tài khoản trong thời gian nhất định để điều tra</li>
            <li><strong>Xóa tài khoản vĩnh viễn:</strong> Áp dụng cho vi phạm nghiêm trọng hoặc tái phạm</li>
            <li><strong>Báo cáo cơ quan có thẩm quyền:</strong> Trong trường hợp vi phạm pháp luật nghiêm trọng</li>
          </ul>
          <p className="mt-3">
            Mọi quyết định xử lý vi phạm của Ban quản trị là quyết định cuối cùng trong khuôn khổ Website. Thành viên có thể khiếu nại lên Ban chỉ huy SROV trong vòng 7 ngày kể từ ngày nhận thông báo xử lý.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">15. Báo cáo vi phạm</h2>
          <p>
            Nếu bạn phát hiện nội dung vi phạm, hành vi lạm dụng hoặc bất kỳ vấn đề nào trên Website, vui lòng báo cáo ngay cho Ban quản trị qua:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Email: <a href="mailto:hoaidung2806le@gmail.com" className="text-[#0059b2] hover:underline">hoaidung2806le@gmail.com</a></li>
            <li>Liên hệ trực tiếp với HADMIN hoặc ADMIN trên nền tảng Discord của cộng đồng SROV</li>
            <li>Sử dụng tính năng báo cáo nội dung (nếu có) trên Website</li>
          </ul>
          <p className="mt-3">Ban quản trị cam kết xử lý mọi báo cáo vi phạm trong vòng 48 giờ làm việc.</p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">16. Bảo trì và gián đoạn dịch vụ</h2>
          <p>
            Ban quản trị có quyền tạm ngừng Website bất kỳ lúc nào để bảo trì, nâng cấp hoặc xử lý sự cố kỹ thuật. Trong trường hợp có thể, chúng tôi sẽ thông báo trước cho cộng đồng qua các kênh liên lạc chính thức của SROV.
          </p>
          <p className="mt-3">
            Ban quản trị không cam kết Website sẽ hoạt động liên tục 24/7. Thời gian gián đoạn do bảo trì hoặc sự cố kỹ thuật không được coi là vi phạm Điều khoản sử dụng này.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">17. Lưu trữ và sao lưu dữ liệu</h2>
          <p>
            Ban quản trị thực hiện sao lưu dữ liệu định kỳ nhưng không cam kết phục hồi được toàn bộ dữ liệu trong mọi tình huống. Quản trị viên được khuyến khích tự lưu bản sao của các nội dung quan trọng.
          </p>
          <p className="mt-3">
            Dữ liệu người dùng và nội dung Website được lưu trữ trên hạ tầng điện toán đám mây của Supabase. Chính sách lưu trữ và bảo mật dữ liệu của Supabase áp dụng đối với toàn bộ dữ liệu này.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">18. Tính độc lập của các điều khoản</h2>
          <p>
            Nếu bất kỳ điều khoản nào trong Điều khoản sử dụng này được xác định là không hợp lệ, trái pháp luật hoặc không thể thực thi theo quy định của pháp luật áp dụng, điều khoản đó sẽ bị loại bỏ hoặc giới hạn ở mức tối thiểu cần thiết. Các điều khoản còn lại vẫn có hiệu lực đầy đủ và ràng buộc pháp lý.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">19. Luật điều chỉnh</h2>
          <p>
            Các Điều khoản sử dụng này được điều chỉnh và giải thích theo pháp luật Cộng hòa xã hội chủ nghĩa Việt Nam. Mọi tranh chấp phát sinh từ hoặc liên quan đến các Điều khoản này sẽ được giải quyết ưu tiên bằng thương lượng, hòa giải trong nội bộ cộng đồng SROV.
          </p>
          <p className="mt-3">
            Trong trường hợp không thể giải quyết bằng thương lượng, các bên đồng ý đưa tranh chấp ra Tòa án có thẩm quyền theo quy định của pháp luật Việt Nam. Địa điểm xét xử mặc định là Tòa án Nhân dân tỉnh/thành phố nơi Ban quản trị SROV đặt trụ sở vận hành.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">20. Thay đổi điều khoản</h2>
          <p>
            Ban quản trị SROV có quyền thay đổi, cập nhật các Điều khoản sử dụng này bất kỳ lúc nào. Khi có thay đổi quan trọng, chúng tôi sẽ cố gắng thông báo qua các kênh liên lạc chính thức của cộng đồng SROV ít nhất 7 ngày trước khi thay đổi có hiệu lực, trừ trường hợp thay đổi khẩn cấp do yêu cầu pháp lý.
          </p>
          <p className="mt-3">
            Việc tiếp tục sử dụng Website sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các Điều khoản mới. Nếu bạn không đồng ý với điều khoản mới, vui lòng ngừng sử dụng Website và liên hệ Ban quản trị để xử lý tài khoản của bạn.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#002060] mb-3">21. Liên hệ</h2>
          <p>Nếu có câu hỏi về Điều khoản sử dụng, vui lòng liên hệ:</p>
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
        <a href="/chinh-sach-bao-mat" className="text-[13px] text-[#0059b2] font-bold hover:underline flex items-center gap-1.5">
          Chính sách bảo mật →
        </a>
      </div>
    </div>
  );
}
