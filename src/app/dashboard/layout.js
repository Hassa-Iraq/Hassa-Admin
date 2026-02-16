import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="ml-64">
                <Topbar />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
