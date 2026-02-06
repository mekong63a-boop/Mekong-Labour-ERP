import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { VirtualTable, VirtualTableColumn } from "@/components/ui/virtual-table";
import { Trainee } from "@/types/trainee";
import { formatVietnameseDatetime } from "@/lib/vietnamese-utils";

/**
 * TRAINEE VIRTUAL TABLE
 * 
 * QUY TẮC VÀNG #3: Scalability - Hỗ trợ triệu records
 * 
 * Sử dụng virtual scrolling để render hiệu quả với dữ liệu lớn.
 * Chỉ render các rows đang hiển thị trong viewport.
 */

interface TraineeVirtualTableProps {
  trainees: Trainee[];
  containerHeight?: number | string;
}

export function TraineeVirtualTable({ 
  trainees, 
  containerHeight = 600 
}: TraineeVirtualTableProps) {
  const navigate = useNavigate();

  const formatDate = formatVietnameseDatetime;

  const columns = useMemo<VirtualTableColumn<Trainee>[]>(() => [
    {
      key: "trainee_code",
      header: "Mã TTS",
      width: 120,
      className: "font-mono",
      render: (trainee) => trainee.trainee_code,
    },
    {
      key: "full_name",
      header: "Họ tên",
      minWidth: 200,
      className: "font-medium",
      render: (trainee) => trainee.full_name,
    },
    {
      key: "simple_status",
      header: "Trạng thái",
      width: 140,
      render: (trainee) => (
        trainee.simple_status ? (
          <Badge variant="outline">{trainee.simple_status}</Badge>
        ) : null
      ),
    },
    {
      key: "progression_stage",
      header: "Giai đoạn",
      width: 160,
      render: (trainee) => (
        trainee.progression_stage ? (
          <Badge variant="secondary">{trainee.progression_stage}</Badge>
        ) : null
      ),
    },
    {
      key: "trainee_type",
      header: "Loại",
      width: 100,
      render: (trainee) => trainee.trainee_type || "—",
    },
    {
      key: "updated_at",
      header: "Cập nhật",
      width: 160,
      className: "text-muted-foreground",
      render: (trainee) => formatDate(trainee.updated_at),
    },
  ], []);

  const handleRowClick = (trainee: Trainee) => {
    navigate(`/trainees/${trainee.id}`);
  };

  return (
    <VirtualTable
      data={trainees}
      columns={columns}
      containerHeight={containerHeight}
      rowHeight={52}
      onRowClick={handleRowClick}
      getRowKey={(trainee) => trainee.id}
      emptyMessage="Không có thực tập sinh nào"
      overscan={10}
    />
  );
}
