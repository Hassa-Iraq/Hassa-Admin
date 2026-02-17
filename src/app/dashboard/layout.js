import Sidebar from "../components/Sidebar";
export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="ml-64">
                <main className="p-0">{children}</main>
            </div>
        </div>
    );
}
