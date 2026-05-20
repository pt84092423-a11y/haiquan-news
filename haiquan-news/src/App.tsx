import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HomePage from "@/pages/HomePage";
import ArticlePage from "@/pages/ArticlePage";
import BaoInPage from "@/pages/BaoInPage";
import StructurePage from "@/pages/StructurePage";
import CommandPage from "@/pages/CommandPage";
import ContactPage from "@/pages/ContactPage";
import CategoryPage from "@/pages/CategoryPage";
import MediaListingPage, { MEDIA_LISTING_SLUGS } from "@/pages/MediaListingPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import PostEditor from "@/pages/admin/PostEditor";
import PostList from "@/pages/admin/PostList";
import CategoryManager from "@/pages/admin/CategoryManager";
import AdminSettings from "@/pages/admin/AdminSettings";
import DBSetup from "@/pages/admin/DBSetup";
import Login from "@/pages/admin/Login";
import UserManager from "@/pages/admin/UserManager";
import AuditLog from "@/pages/admin/AuditLog";
import ApprovalQueue from "@/pages/admin/ApprovalQueue";
import AdminBaoIn from "@/pages/admin/AdminBaoIn";
import AdminBaoInCuoiTuan from "@/pages/admin/AdminBaoInCuoiTuan";
import StructureManager from "@/pages/admin/StructureManager";
import CommandManager from "@/pages/admin/CommandManager";
import AdminAds from "@/pages/admin/AdminAds";
import AdminComments from "@/pages/admin/AdminComments";
import NavManager from "@/pages/admin/NavManager";
import HadminPanel from "@/pages/admin/HadminPanel";
import DiscordBot from "@/pages/admin/DiscordBot";
import ImportVideo from "@/pages/admin/ImportVideo";
import DiscordReader from "@/pages/admin/DiscordReader";
import IpMonitor from "@/pages/admin/IpMonitor";
import YoutubeManager from "@/pages/admin/YoutubeManager";
import CommentManager from "@/pages/admin/CommentManager";
import AdminUserProfile from "@/pages/admin/AdminUserProfile";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import AdminSEO from "@/pages/admin/AdminSEO";
import NavyGalleryStrip from "@/components/NavyGalleryStrip";
import SearchPage from "@/pages/SearchPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import { getSession, can } from "@/lib/auth";

const queryClient = new QueryClient();

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <div className="flex-grow">{children}</div>
      <NavyGalleryStrip />
      <SiteFooter />
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e: Error) { return { error: e?.message || String(e) }; }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-xl w-full shadow">
          <p className="text-xl font-black text-red-600 mb-2">⚠️ Lỗi trang</p>
          <p className="text-gray-500 text-sm mb-4">Trang này gặp lỗi JavaScript. Vui lòng chụp màn hình và báo cáo:</p>
          <pre className="bg-red-50 text-red-700 text-xs p-4 rounded-lg whitespace-pre-wrap break-all">{this.state.error}</pre>
          <button onClick={() => this.setState({ error: null })} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Thử lại</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

function ProtectedRoute({ component: Comp, action }: { component: React.ComponentType; action?: string }) {
  const session = getSession();
  const [, setLocation] = useLocation();
  if (!session) {
    setTimeout(() => setLocation('/admin/login'), 0);
    return <div className="min-h-screen bg-[#01122e] flex items-center justify-center"><div className="text-white text-sm opacity-60">Đang chuyển hướng...</div></div>;
  }
  if (action && !can(session.role, action)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500 mb-2">Không có quyền truy cập</p>
          <p className="text-gray-500 text-sm">Bạn không đủ quyền để xem trang này.</p>
          <a href="/admin" className="mt-4 inline-block text-[#0059b2] font-bold text-sm hover:underline">← Quay lại</a>
        </div>
      </div>
    );
  }
  return <Comp />;
}

function TrackingLayer() {
  useVisitorTracking();
  return null;
}

function Router() {
  return (
    <>
      <TrackingLayer />
      <Switch>
      {/* Admin routes phải đứng TRƯỚC các public routes */}
      <Route path="/admin/login" component={Login} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} />} />
      <Route path="/admin/bai-viet/moi" component={() => <ProtectedRoute component={PostEditor} action="write_post" />} />
      <Route path="/admin/bai-viet/:id" component={() => <ProtectedRoute component={PostEditor} action="write_post" />} />
      <Route path="/admin/bai-viet" component={() => <ProtectedRoute component={PostList} />} />
      <Route path="/admin/chuyen-muc" component={() => <ProtectedRoute component={CategoryManager} />} />
      <Route path="/admin/cai-dat" component={() => <ProtectedRoute component={AdminSettings} />} />
      <Route path="/admin/setup" component={() => <ProtectedRoute component={DBSetup} />} />
      <Route path="/admin/nguoi-dung" component={() => <ProtectedRoute component={UserManager} action="manage_users" />} />
      <Route path="/admin/audit-log" component={() => <ProtectedRoute component={AuditLog} action="view_audit_log" />} />
      <Route path="/admin/duyet-yeu-cau" component={() => <ProtectedRoute component={ApprovalQueue} action="approve_requests" />} />
      <Route path="/admin/bao-in" component={() => <ProtectedRoute component={AdminBaoIn} action="write_post" />} />
      <Route path="/admin/bao-in-cuoi-tuan" component={() => <ProtectedRoute component={AdminBaoInCuoiTuan} action="write_post" />} />
      <Route path="/admin/cau-truc" component={() => <ProtectedRoute component={StructureManager} />} />
      <Route path="/admin/chi-huy" component={() => <ProtectedRoute component={CommandManager} />} />
      <Route path="/admin/cau-truc-chi-huy" component={() => <ProtectedRoute component={StructureManager} />} />
      <Route path="/admin/quang-cao" component={() => <ProtectedRoute component={AdminAds} />} />
      <Route path="/admin/thanh-dieu-huong" component={() => <ProtectedRoute component={NavManager} />} />
      <Route path="/admin/hadmin" component={() => <ProtectedRoute component={HadminPanel} action="view_hadmin_panel" />} />
      <Route path="/admin/discord-bot" component={() => <ErrorBoundary><ProtectedRoute component={DiscordBot} /></ErrorBoundary>} />
      <Route path="/admin/import-video" component={() => <ProtectedRoute component={ImportVideo} action="write_post" />} />
      <Route path="/admin/discord-reader" component={() => <ProtectedRoute component={DiscordReader} />} />
      <Route path="/admin/ip-monitor" component={() => <ProtectedRoute component={IpMonitor} action="view_audit_log" />} />
      <Route path="/admin/youtube" component={() => <ProtectedRoute component={YoutubeManager} />} />
      <Route path="/admin/binh-luan" component={() => <ProtectedRoute component={AdminComments} action="manage_comments" />} />
      <Route path="/admin/seo" component={() => <ProtectedRoute component={AdminSEO} />} />
      <Route path="/admin/ho-so" component={() => <ProtectedRoute component={AdminUserProfile} />} />
      <Route path="/admin/ho-so-nguoi-dung" component={() => <ProtectedRoute component={AdminUserProfile} />} />
      <Route path="/admin/phan-tich" component={() => <ProtectedRoute component={AdminAnalytics} />} />

      {/* Public routes */}
      <Route path="/" component={() => <PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/bao-in" component={() => <PublicLayout><BaoInPage /></PublicLayout>} />
      <Route path="/cau-truc" component={() => <PublicLayout><StructurePage /></PublicLayout>} />
      <Route path="/chi-huy" component={() => <PublicLayout><CommandPage /></PublicLayout>} />
      <Route path="/lien-he" component={() => <PublicLayout><ContactPage /></PublicLayout>} />
      <Route path="/bai-viet/:slug" component={() => (
        <PublicLayout><ArticlePage /></PublicLayout>
      )} />

      {/* Search page */}
      <Route path="/tim-kiem" component={() => (
        <PublicLayout><SearchPage /></PublicLayout>
      )} />

      {/* Legal pages */}
      <Route path="/dieu-khoan" component={() => (
        <PublicLayout><TermsPage /></PublicLayout>
      )} />
      <Route path="/chinh-sach-bao-mat" component={() => (
        <PublicLayout><PrivacyPage /></PublicLayout>
      )} />

      {/* Các trang đa phương tiện chuyên biệt (Longform / Phóng sự ảnh / Podcast / Short Video / Hải quân Media) */}
      {MEDIA_LISTING_SLUGS.map(slug => (
        <Route key={slug} path={`/${slug}`} component={() => (
          <PublicLayout><MediaListingPage key={slug} slug={slug} /></PublicLayout>
        )} />
      ))}

      {/* Category + other pages - /:slug phải đứng CUỐI */}
      <Route path="/:slug" component={() => (
        <PublicLayout><CategoryPage /></PublicLayout>
      )} />

      <Route component={() => (
        <PublicLayout>
          <div className="container mx-auto max-w-[1200px] px-4 py-20 text-center">
            <h1 className="text-4xl font-bold text-[#0059b2] mb-4">404</h1>
            <p className="text-[#555555] mb-6">Trang không tồn tại</p>
            <a href="/" className="text-[#0059b2] font-bold hover:underline">← Về trang chủ</a>
          </div>
        </PublicLayout>
      )} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
