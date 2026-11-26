// src/app/manager/Pagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}: PaginationProps) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="p-4 border-t border-[#EAE3D2] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FAF6F0]/60">
            <div className="text-xs text-[#8C7A6B] font-medium">
                Hiển thị <span className="font-bold text-[#2C2621]">{startItem}</span> -{" "}
                <span className="font-bold text-[#2C2621]">{endItem}</span> trên tổng số{" "}
                <span className="font-bold text-[#2C2621]">{totalItems}</span> tài khoản
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-white border border-[#EAE3D2] hover:bg-[#FAF6F0] text-[#5C5246] disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-xs"
                    title="Trang trước"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-[#EAE3D2] rounded-xl text-[#2C2621] font-mono shadow-xs">
                    Trang <span className="text-amber-800 font-bold">{currentPage}</span> / {totalPages}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-xl bg-white border border-[#EAE3D2] hover:bg-[#FAF6F0] text-[#5C5246] disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-xs"
                    title="Trang kế tiếp"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}