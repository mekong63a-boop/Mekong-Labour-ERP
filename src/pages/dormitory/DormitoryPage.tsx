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
} from "lucide-react";
import {
  useDormitoriesWithCount,
  useDormitoryResidents,
  useCreateDormitory,
  useUpdateDormitory,
  useDeleteDormitory,
  useAddResident,
  useCheckOutResident,
  useRemoveResident,
  useAvailableTrainees,
  Dormitory,
} from "@/hooks/useDormitory";
import { format } from "date-fns";

export default function DormitoryPage() {
  const [selectedDormitory, setSelectedDormitory] = useState<string | null>(null);
  const [isAddDormOpen, setIsAddDormOpen] = useState(false);
  const [isEditDormOpen, setIsEditDormOpen] = useState(false);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [editingDorm, setEditingDorm] = useState<Dormitory | null>(null);

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

  // Queries
  const { data: dormitories, isLoading: isLoadingDorms } = useDormitoriesWithCount();
  const { data: residents, isLoading: isLoadingResidents } = useDormitoryResidents(selectedDormitory);
  const { data: availableTrainees } = useAvailableTrainees();

  // Mutations
  const createDormitory = useCreateDormitory();
  const updateDormitory = useUpdateDormitory();
  const deleteDormitory = useDeleteDormitory();
  const addResident = useAddResident();
  const checkOutResident = useCheckOutResident();
  const removeResident = useRemoveResident();

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

  const openEditDialog = (dorm: Dormitory) => {
    setEditingDorm(dorm);
    setNewDormName(dorm.name);
    setNewDormAddress(dorm.address || "");
    setNewDormCapacity(String(dorm.capacity));
    setNewDormNotes(dorm.notes || "");
    setIsEditDormOpen(true);
  };

  const selectedDormData = dormitories?.find((d) => d.id === selectedDormitory);

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
      </header>

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
                          {format(new Date(res.check_in_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={res.status === "Đang ở" ? "default" : "secondary"}
                          >
                            {res.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {res.status === "Đang ở" && (
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
                                    Bạn có chắc muốn xóa học viên này khỏi danh sách KTX?
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
    </div>
  );
}
