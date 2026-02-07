import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Plus,
  Users,
  Trash2,
  Edit,
  UserPlus,
  LogOut,
  MapPin,
  Loader2,
  Home,
  User,
  ArrowRightLeft,
  History,
  ArrowRight,
  Search,
} from "lucide-react";
import { ExportButtonWithColumns } from '@/components/ui/export-button-with-columns';
import { EXPORT_CONFIGS } from '@/lib/export-configs';
import {
  useDormitoriesWithCount,
  useDormitoryResidents,
  useCreateDormitory,
  useUpdateDormitory,
  useDeleteDormitory,
  useAddResident,
  useCheckOutResident,
  useRemoveResident,
  useAvailableTraineesForDormitory,
  useTraineesInOtherDormitories,
  useTransferResident,
  useTraineeDormitoryHistory,
  useSearchTraineeDormitory,
  useDormitoryGenderStats,
  Dormitory,
  DormitoryResident,
} from "@/hooks/useDormitory";
import { formatVietnameseDate } from "@/lib/vietnamese-utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useCanAccessMenu } from "@/hooks/useMenuPermissions";

export default function DormitoryPage() {
  // Permission check for dormitory menu
  const { canCreate, canUpdate, canDelete } = useCanAccessMenu("dormitory");
  const [activeTab, setActiveTab] = useState("manage");
  const [selectedDormitory, setSelectedDormitory] = useState<string | null>(null);
  const [isAddDormOpen, setIsAddDormOpen] = useState(false);
  const [isEditDormOpen, setIsEditDormOpen] = useState(false);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTraineeId, setHistoryTraineeId] = useState<string | null>(null);
  const [historyTraineeName, setHistoryTraineeName] = useState<string>("");
  const [editingDorm, setEditingDorm] = useState<Dormitory | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Form states
  const [newDormName, setNewDormName] = useState("");
  const [newDormAddress, setNewDormAddress] = useState("");
  const [newDormCapacity, setNewDormCapacity] = useState("20");
  const [newDormNotes, setNewDormNotes] = useState("");

  // Resident form
  const [selectedTrainee, setSelectedTrainee] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [residentNotes, setResidentNotes] = useState("");

  // Transfer form
  const [selectedTransferResident, setSelectedTransferResident] = useState<DormitoryResident | null>(null);
  const [transferReason, setTransferReason] = useState("");
  const [transferRoom, setTransferRoom] = useState("");
  const [transferBed, setTransferBed] = useState("");

  // Queries
  const { data: dormitories, isLoading: isLoadingDorms } = useDormitoriesWithCount();
  const { data: residents, isLoading: isLoadingResidents } = useDormitoryResidents(selectedDormitory);
  const { data: availableTrainees } = useAvailableTraineesForDormitory();
  const { data: transferableTrainees } = useTraineesInOtherDormitories(selectedDormitory);
  const { data: traineeHistory, isLoading: isLoadingHistory } = useTraineeDormitoryHistory(historyTraineeId);
  const { data: searchResults, isLoading: isSearching } = useSearchTraineeDormitory(debouncedSearch);
  const { data: genderStats } = useDormitoryGenderStats();

  // Mutations
  const createDormitory = useCreateDormitory();
  const updateDormitory = useUpdateDormitory();
  const deleteDormitory = useDeleteDormitory();
  const addResident = useAddResident();
  const checkOutResident = useCheckOutResident();
  const removeResident = useRemoveResident();
  const transferResident = useTransferResident();

  const handleAddDormitory = async () => {
    if (!newDormName.trim()) return;

    await createDormitory.mutateAsync({
      name: newDormName.trim(),
      address: newDormAddress.trim() || undefined,
      capacity: parseInt(newDormCapacity) || 20,
      notes: newDormNotes.trim() || undefined,
    });

    setIsAddDormOpen(false);
    resetDormForm();
  };

  const handleEditDormitory = async () => {
    if (!editingDorm || !newDormName.trim()) return;

    await updateDormitory.mutateAsync({
      id: editingDorm.id,
      updates: {
        name: newDormName.trim(),
        address: newDormAddress.trim() || null,
        capacity: parseInt(newDormCapacity) || 20,
        notes: newDormNotes.trim() || null,
      },
    });

    setIsEditDormOpen(false);
    setEditingDorm(null);
    resetDormForm();
  };

  const handleDeleteDormitory = async (id: string) => {
    await deleteDormitory.mutateAsync(id);
    if (selectedDormitory === id) {
      setSelectedDormitory(null);
    }
  };

  const handleAddResident = async () => {
    if (!selectedDormitory || !selectedTrainee) return;

    await addResident.mutateAsync({
      dormitory_id: selectedDormitory,
      trainee_id: selectedTrainee,
      room_number: roomNumber.trim() || undefined,
      bed_number: bedNumber.trim() || undefined,
      notes: residentNotes.trim() || undefined,
    });

    setIsAddResidentOpen(false);
    resetResidentForm();
  };

  const handleCheckOut = async (residentId: string) => {
    await checkOutResident.mutateAsync({ id: residentId });
  };

  const handleRemoveResident = async (residentId: string) => {
    await removeResident.mutateAsync(residentId);
  };

  const handleTransfer = async () => {
    if (!selectedDormitory || !selectedTransferResident || !transferReason.trim()) return;

    await transferResident.mutateAsync({
      currentResidentId: selectedTransferResident.id,
      traineeId: selectedTransferResident.trainee_id,
      fromDormitoryId: selectedTransferResident.dormitory_id,
      toDormitoryId: selectedDormitory,
      roomNumber: transferRoom.trim() || undefined,
      bedNumber: transferBed.trim() || undefined,
      transferReason: transferReason.trim(),
    });

    setIsTransferOpen(false);
    resetTransferForm();
  };

  const openHistory = (traineeId: string, traineeName: string) => {
    setHistoryTraineeId(traineeId);
    setHistoryTraineeName(traineeName);
    setIsHistoryOpen(true);
  };

  const resetDormForm = () => {
    setNewDormName("");
    setNewDormAddress("");
    setNewDormCapacity("20");
    setNewDormNotes("");
  };

  const resetResidentForm = () => {
    setSelectedTrainee("");
    setRoomNumber("");
    setBedNumber("");
    setResidentNotes("");
  };

  const resetTransferForm = () => {
    setSelectedTransferResident(null);
    setTransferReason("");
    setTransferRoom("");
    setTransferBed("");
  };

  const openEditDialog = (dorm: Dormitory) => {
    setEditingDorm(dorm);
    setNewDormName(dorm.name);
    setNewDormAddress(dorm.address || "");
    setNewDormCapacity(String(dorm.capacity));
    setNewDormNotes(dorm.notes || "");
    setIsEditDormOpen(true);
  };

  const selectedDormData = dormitories?.find((d) => d.id === selectedDormitory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Đang ở":
        return <Badge variant="default">{status}</Badge>;
      case "Đã rời":
        return <Badge variant="secondary">{status}</Badge>;
      case "Đã chuyển":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Quản lý KTX
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý ký túc xá và học viên ở KTX
          </p>
        </div>
        <ExportButtonWithColumns
          menuKey="dormitory"
          tableName="dormitories"
          allColumns={EXPORT_CONFIGS.dormitory.columns}
          fileName={EXPORT_CONFIGS.dormitory.fileName}
          selectQuery="name, address, capacity, status, notes"
          title="Xuất danh sách KTX"
        />
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manage" className="gap-2">
            <Home className="h-4 w-4" />
            Quản lý KTX
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Tra cứu học viên
          </TabsTrigger>
        </TabsList>

        {/* Tab Tra cứu */}
        <TabsContent value="search" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Tra cứu học viên theo KTX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập tên hoặc mã học viên để tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isSearching && debouncedSearch.length >= 2 && searchResults?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Không tìm thấy học viên nào</p>
                </div>
              )}

              {!isSearching && searchResults && searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((result) => {
                    // Check nếu học viên đã xuất cảnh để hiển thị đúng trạng thái KTX
                    const DEPARTED_STAGES = ["Xuất cảnh", "Đang làm việc", "Bỏ trốn", "Về trước hạn", "Hoàn thành hợp đồng"];
                    const isDeparted = result.trainee.departure_date || 
                      (result.trainee.progression_stage && DEPARTED_STAGES.includes(result.trainee.progression_stage));
                    
                    // Nếu đã xuất cảnh thì không còn "Đang ở" mà là "Đã rời"
                    const hasDormitory = result.currentDormitory && !isDeparted;
                    
                    return (
                      <div
                        key={result.trainee.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {result.trainee.photo_url ? (
                            <img
                              src={result.trainee.photo_url}
                              alt=""
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="font-medium">{result.trainee.full_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {result.trainee.trainee_code}
                                  {result.trainee.phone && ` • ${result.trainee.phone}`}
                                </p>
                              </div>
                              {hasDormitory ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                  <Home className="h-3 w-3 mr-1" />
                                  Đang ở: {result.currentDormitory.name}
                                </Badge>
                              ) : result.currentDormitory && isDeparted ? (
                                <Badge variant="secondary">
                                  <Home className="h-3 w-3 mr-1" />
                                  Đã rời: {result.currentDormitory.name}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Không ở KTX</Badge>
                              )}
                            </div>

                            {result.currentRecord && (
                              <div className="text-sm text-muted-foreground mb-2">
                                Phòng: {result.currentRecord.room_number || "—"} | 
                                Giường: {result.currentRecord.bed_number || "—"} | 
                                Vào ngày: {formatVietnameseDate(result.currentRecord.check_in_date)}
                              </div>
                            )}

                            {/* Lịch sử KTX */}
                            {result.history.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                  <History className="h-3 w-3" />
                                  Lịch sử KTX ({result.history.length} bản ghi)
                                </p>
                                <div className="space-y-2">
                                  {result.history.map((record) => {
                                    // Logic: Nếu đã xuất cảnh hoặc có check_out_date => "Đã rời"
                                    const actualStatus = (record.check_out_date || isDeparted)
                                      ? "Đã rời"
                                      : (record.status || "Đang ở");
                                    return (
                                      <div
                                        key={record.id}
                                        className="text-sm flex items-center gap-2 bg-muted/50 rounded px-2 py-1"
                                      >
                                        {getStatusBadge(actualStatus)}
                                        <span className="font-medium">{record.dormitory?.name}</span>
                                        <span className="text-muted-foreground">
                                        ({formatVietnameseDate(record.check_in_date)}
                                          {record.check_out_date && (
                                            <> → {formatVietnameseDate(record.check_out_date)}</>
                                          )})
                                        </span>
                                        {record.from_dormitory && (
                                          <span className="text-xs text-muted-foreground">
                                            (từ {record.from_dormitory.name})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {debouncedSearch.length < 2 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nhập ít nhất 2 ký tự để tìm kiếm</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          {/* Gender Statistics Table */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Thống kê học viên đang ở KTX
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Tổng số học viên</TableHead>
                    <TableHead className="w-[150px] text-center">Nam</TableHead>
                    <TableHead className="w-[150px] text-center">Nữ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-bold text-lg">
                      {genderStats?.total_residents || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {genderStats?.male_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">
                        {genderStats?.female_count || 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end mb-4">
            {canCreate && (
              <Dialog open={isAddDormOpen} onOpenChange={setIsAddDormOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm KTX mới
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm Ký túc xá mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên KTX *</Label>
                    <Input
                      id="name"
                      placeholder="VD: KTX Số 1"
                      value={newDormName}
                      onChange={(e) => setNewDormName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Địa chỉ</Label>
                    <Input
                      id="address"
                      placeholder="Nhập địa chỉ..."
                      value={newDormAddress}
                      onChange={(e) => setNewDormAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Sức chứa tối đa</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="20"
                      value={newDormCapacity}
                      onChange={(e) => setNewDormCapacity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ghi chú thêm..."
                      value={newDormNotes}
                      onChange={(e) => setNewDormNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDormOpen(false)}>
                    Hủy
                  </Button>
                  <Button
                    onClick={handleAddDormitory}
                    disabled={!newDormName.trim() || createDormitory.isPending}
                  >
                    {createDormitory.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Thêm KTX
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dormitory List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Danh sách KTX
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingDorms ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : dormitories?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có KTX nào
              </div>
            ) : (
              <div className="divide-y">
                {dormitories?.map((dorm) => (
                  <div
                    key={dorm.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedDormitory === dorm.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                    }`}
                    onClick={() => setSelectedDormitory(dorm.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{dorm.name}</h3>
                        {dorm.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {dorm.address}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {dorm.current_occupancy}/{dorm.capacity}
                          </Badge>
                          <Badge
                            variant={dorm.status === "Đang hoạt động" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {dorm.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(dorm);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa KTX?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc muốn xóa KTX "{dorm.name}"? Tất cả dữ liệu học viên
                                  trong KTX này cũng sẽ bị xóa.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDormitory(dorm.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Residents List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {selectedDormData ? `Học viên - ${selectedDormData.name}` : "Học viên trong KTX"}
              </CardTitle>
              {selectedDormData && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedDormData.current_occupancy}/{selectedDormData.capacity} học viên
                </p>
              )}
            </div>
            {selectedDormitory && (
              <div className="flex gap-2">
                <ExportButtonWithColumns
                  menuKey="dormitory"
                  tableName="dormitory_residents"
                  allColumns={EXPORT_CONFIGS.dormitory_residents.columns}
                  fileName={`${EXPORT_CONFIGS.dormitory_residents.fileName}-${selectedDormData?.name || 'ktx'}`}
                  selectQuery="trainee:trainees(trainee_code, full_name, phone), room_number, bed_number, check_in_date, check_out_date, status, notes"
                  filters={{ dormitory_id: selectedDormitory }}
                  title={`Xuất danh sách học viên KTX - ${selectedDormData?.name || ''}`}
                />
                {canUpdate && (
                  <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        Chuyển KTX
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Chuyển học viên từ KTX khác</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Chọn học viên muốn chuyển *</Label>
                          <Select
                            value={selectedTransferResident?.id || ""}
                            onValueChange={(val) => {
                              const resident = transferableTrainees?.find((r) => r.id === val);
                              setSelectedTransferResident(resident || null);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn học viên..." />
                            </SelectTrigger>
                            <SelectContent>
                              {transferableTrainees?.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.trainee?.trainee_code} - {r.trainee?.full_name} ({r.dormitory?.name})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {transferableTrainees?.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              Không có học viên ở KTX khác để chuyển
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Lý do chuyển KTX *</Label>
                          <Textarea
                            placeholder="VD: Chuyển do yêu cầu đổi phòng, gần lớp học..."
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Số phòng mới</Label>
                            <Input
                              placeholder="VD: P101"
                              value={transferRoom}
                              onChange={(e) => setTransferRoom(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Số giường mới</Label>
                            <Input
                              placeholder="VD: G1"
                              value={transferBed}
                              onChange={(e) => setTransferBed(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
                          Hủy
                        </Button>
                        <Button
                          onClick={handleTransfer}
                          disabled={!selectedTransferResident || !transferReason.trim() || transferResident.isPending}
                        >
                          {transferResident.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Chuyển KTX
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {canCreate && (
                  <Dialog open={isAddResidentOpen} onOpenChange={setIsAddResidentOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Thêm học viên
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Thêm học viên vào KTX</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Chọn học viên *</Label>
                        <Select value={selectedTrainee} onValueChange={setSelectedTrainee}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn học viên..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTrainees?.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.trainee_code} - {t.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {availableTrainees?.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Không có học viên khả dụng (đã ở KTX hoặc không ở giai đoạn phù hợp)
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="room">Số phòng</Label>
                          <Input
                            id="room"
                            placeholder="VD: P101"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bed">Số giường</Label>
                          <Input
                            id="bed"
                            placeholder="VD: G1"
                            value={bedNumber}
                            onChange={(e) => setBedNumber(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resNotes">Ghi chú</Label>
                        <Textarea
                          id="resNotes"
                          placeholder="Ghi chú thêm..."
                          value={residentNotes}
                          onChange={(e) => setResidentNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddResidentOpen(false)}>
                        Hủy
                      </Button>
                      <Button
                        onClick={handleAddResident}
                        disabled={!selectedTrainee || addResident.isPending}
                      >
                        {addResident.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Thêm học viên
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedDormitory ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chọn một KTX để xem danh sách học viên</p>
              </div>
            ) : isLoadingResidents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : residents?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có học viên nào trong KTX này</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Học viên</TableHead>
                      <TableHead>Phòng</TableHead>
                      <TableHead>Giường</TableHead>
                      <TableHead>Ngày vào</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residents?.map((res, index) => (
                      <TableRow key={res.id}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {res.trainee?.photo_url ? (
                              <img
                                src={res.trainee.photo_url}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{res.trainee?.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {res.trainee?.trainee_code}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{res.room_number || "—"}</TableCell>
                        <TableCell>{res.bed_number || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {formatVietnameseDate(res.check_in_date)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(res.status)}
                          {res.from_dormitory && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Từ: {res.from_dormitory.name}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Xem lịch sử KTX"
                              onClick={() => openHistory(res.trainee_id, res.trainee?.full_name || "")}
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>
                            {res.status === "Đang ở" && canUpdate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Rời KTX"
                                onClick={() => handleCheckOut(res.id)}
                              >
                                <LogOut className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Xóa học viên khỏi KTX?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bạn có chắc muốn xóa học viên này khỏi danh sách KTX? Lịch sử sẽ bị xóa hoàn toàn.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveResident(res.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Xóa
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dormitory Dialog */}
      <Dialog open={isEditDormOpen} onOpenChange={setIsEditDormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa KTX</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Tên KTX *</Label>
              <Input
                id="editName"
                value={newDormName}
                onChange={(e) => setNewDormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddress">Địa chỉ</Label>
              <Input
                id="editAddress"
                value={newDormAddress}
                onChange={(e) => setNewDormAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCapacity">Sức chứa tối đa</Label>
              <Input
                id="editCapacity"
                type="number"
                value={newDormCapacity}
                onChange={(e) => setNewDormCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">Ghi chú</Label>
              <Textarea
                id="editNotes"
                value={newDormNotes}
                onChange={(e) => setNewDormNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDormOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleEditDormitory}
              disabled={!newDormName.trim() || updateDormitory.isPending}
            >
              {updateDormitory.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Lịch sử KTX - {historyTraineeName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : traineeHistory?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có lịch sử KTX</p>
            ) : (
              <div className="space-y-4">
                {traineeHistory?.map((record, index) => (
                  <div
                    key={record.id}
                    className={`relative pl-6 pb-4 ${
                      index < (traineeHistory?.length || 0) - 1 ? "border-l-2 border-muted" : ""
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-1.5 ${
                        record.status === "Đang ở"
                          ? "bg-green-500"
                          : record.status === "Đã chuyển"
                          ? "bg-amber-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {record.dormitory?.name}
                            {getStatusBadge(record.status)}
                          </h4>
                          {record.from_dormitory && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <ArrowRight className="h-3 w-3" />
                              Chuyển từ: {record.from_dormitory.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>Phòng: {record.room_number || "—"}</p>
                          <p>Giường: {record.bed_number || "—"}</p>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Ngày vào:</span>{" "}
                          {formatVietnameseDate(record.check_in_date)}
                        </p>
                        {record.check_out_date && (
                          <p>
                            <span className="text-muted-foreground">Ngày ra:</span>{" "}
                            {formatVietnameseDate(record.check_out_date)}
                          </p>
                        )}
                        {record.transfer_reason && (
                          <p className="mt-2 text-muted-foreground italic">
                            Lý do: {record.transfer_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
