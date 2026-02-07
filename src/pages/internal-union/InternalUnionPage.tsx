import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Users, TrendingUp, TrendingDown, Wallet, Pencil, Trash2, Cake } from 'lucide-react';
import { useCanAction } from '@/hooks/useMenuPermissions';
import { ExportButtonWithColumns } from '@/components/ui/export-button-with-columns';
import { EXPORT_CONFIGS } from '@/lib/export-configs';
import { format, differenceInDays, setYear, isAfter, isBefore } from 'date-fns';
import { formatVietnameseDate } from '@/lib/vietnamese-utils';
import {
  useUnionMembers,
  useUnionTransactions,
  useUnionStats,
  useCreateUnionMember,
  useUpdateUnionMember,
  useCreateUnionTransaction,
  useDeleteUnionMember,
  useDeleteUnionTransaction,
  UnionMember,
} from '@/hooks/useInternalUnion';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';

const PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh",
  "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước", "Bình Thuận", "Cà Mau",
  "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai",
  "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương",
  "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang",
  "Kon Tum", "Lai Châu", "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Long An", "Nam Định",
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La",
  "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang",
  "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

// Helper function to calculate days until birthday - using local dates to avoid timezone issues
const getDaysUntilBirthday = (birthDate: string | null): number => {
  if (!birthDate) return 999; // No birthday = sort to end
  
  // Parse dates as local dates without time component
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayParts = todayStr.split('-').map(Number);
  const birthParts = birthDate.split('-').map(Number);
  
  // Create birthday for this year (using month and day from birth_date)
  const thisYearBirthday = new Date(todayParts[0], birthParts[1] - 1, birthParts[2]);
  const today = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
  
  // Calculate difference in days
  let diffMs = thisYearBirthday.getTime() - today.getTime();
  
  // If birthday has passed this year, get next year's birthday
  if (diffMs < 0) {
    const nextYearBirthday = new Date(todayParts[0] + 1, birthParts[1] - 1, birthParts[2]);
    diffMs = nextYearBirthday.getTime() - today.getTime();
  }
  
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

// Check if birthday is today
const isBirthdayToday = (birthDate: string | null): boolean => {
  if (!birthDate) return false;
  return getDaysUntilBirthday(birthDate) === 0;
};

// Check if birthday is upcoming (within 30 days) or today
const isUpcomingBirthday = (birthDate: string | null): boolean => {
  if (!birthDate) return false;
  const days = getDaysUntilBirthday(birthDate);
  return days >= 0 && days <= 30;
};

const InternalUnionPage = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<UnionMember | null>(null);

  const { data: members = [], isLoading: membersLoading } = useUnionMembers();
  const { data: transactions = [], isLoading: transactionsLoading } = useUnionTransactions();
  const stats = useUnionStats();

  const createMember = useCreateUnionMember();
  const updateMember = useUpdateUnionMember();
  const createTransaction = useCreateUnionTransaction();
  const deleteMember = useDeleteUnionMember();
  const deleteTransaction = useDeleteUnionTransaction();

  const { hasPermission: canCreate } = useCanAction("internal-union", "create");
  const { hasPermission: canUpdate } = useCanAction("internal-union", "update");
  const { hasPermission: canDelete } = useCanAction("internal-union", "delete");
  const [memberForm, setMemberForm] = useState({
    member_code: '',
    full_name: '',
    birth_date: '',
    hometown: '',
    join_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    status: 'Đang tham gia',
    notes: '',
  });

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    transaction_type: 'Thu' as 'Thu' | 'Chi',
    amount: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    member_id: '',
    description: '',
  });

  // Filter and sort members - upcoming birthdays first
  const filteredMembers = members
    .filter(
      (member) =>
        member.member_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => getDaysUntilBirthday(a.birth_date) - getDaysUntilBirthday(b.birth_date));

  const filteredTransactions = transactions.filter(
    (t) =>
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.member?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open dialog for editing
  const handleEditMember = (member: UnionMember) => {
    setEditingMember(member);
    setMemberForm({
      member_code: member.member_code,
      full_name: member.full_name,
      birth_date: member.birth_date || '',
      hometown: member.hometown || '',
      join_date: member.join_date,
      end_date: member.end_date || '',
      status: member.status || 'Đang tham gia',
      notes: member.notes || '',
    });
    setMemberDialogOpen(true);
  };

  // Reset form and close dialog
  const handleCloseDialog = () => {
    setMemberDialogOpen(false);
    setEditingMember(null);
    setMemberForm({
      member_code: '',
      full_name: '',
      birth_date: '',
      hometown: '',
      join_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      status: 'Đang tham gia',
      notes: '',
    });
  };

  const handleSaveMember = async () => {
    if (!memberForm.member_code || !memberForm.full_name) {
      return;
    }

    const memberData = {
      member_code: memberForm.member_code,
      full_name: memberForm.full_name,
      birth_date: memberForm.birth_date || null,
      hometown: memberForm.hometown || null,
      join_date: memberForm.join_date,
      end_date: memberForm.end_date || null,
      status: memberForm.status,
      notes: memberForm.notes || null,
    };

    if (editingMember) {
      await updateMember.mutateAsync({
        id: editingMember.id,
        ...memberData,
      });
    } else {
      await createMember.mutateAsync(memberData);
    }

    handleCloseDialog();
  };

  const handleAddTransaction = async () => {
    if (!transactionForm.amount) {
      return;
    }

    await createTransaction.mutateAsync({
      transaction_type: transactionForm.transaction_type,
      amount: Number(transactionForm.amount),
      transaction_date: transactionForm.transaction_date,
      member_id: transactionForm.member_id || null,
      description: transactionForm.description || null,
    });

    setTransactionDialogOpen(false);
    setTransactionForm({
      transaction_type: 'Thu',
      amount: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      member_id: '',
      description: '',
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'Đang tham gia':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đang tham gia</Badge>;
      case 'Đã kết thúc':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Đã kết thúc</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4D3E]">Công đoàn nội bộ</h1>
          <p className="text-muted-foreground">Quản lý thành viên và tài chính công đoàn</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'members' && (
            <ExportButtonWithColumns
              menuKey="internal-union"
              tableName="union_members"
              allColumns={EXPORT_CONFIGS.internal_union.columns}
              fileName={EXPORT_CONFIGS.internal_union.fileName}
              selectQuery="member_code, full_name, birth_date, hometown, join_date, end_date, status, notes"
              title="Xuất danh sách thành viên công đoàn"
            />
          )}
          {activeTab === 'transactions' && (
            <ExportButtonWithColumns
              menuKey="internal-union"
              tableName="union_transactions"
              allColumns={EXPORT_CONFIGS.internal_union_transactions.columns}
              fileName={EXPORT_CONFIGS.internal_union_transactions.fileName}
              selectQuery="transaction_type, amount, transaction_date, member:union_members(full_name), description"
              title="Xuất danh sách giao dịch công đoàn"
            />
          )}
          {canCreate && (
            <>
              <Button
                variant="outline"
                onClick={() => setTransactionDialogOpen(true)}
                className="border-[#1B4D3E] text-[#1B4D3E] hover:bg-[#1B4D3E]/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm giao dịch
              </Button>
              <Button
                onClick={() => setMemberDialogOpen(true)}
                className="bg-[#1B4D3E] hover:bg-[#1B4D3E]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm thành viên
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng thành viên</p>
                <p className="text-2xl font-bold text-[#1B4D3E]">{stats.activeMembers}</p>
                <p className="text-xs text-muted-foreground">Đang tham gia công đoàn</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng thu</p>
                <p className="text-2xl font-bold text-[#1B4D3E]">{formatCurrency(stats.totalIncome)}</p>
                <p className="text-xs text-muted-foreground">Tổng số tiền đã thu</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#1B4D3E]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã chi</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
                <p className="text-xs text-muted-foreground">Tổng số tiền đã chi</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Còn lại</p>
                <p className="text-2xl font-bold text-[#1B4D3E]">{formatCurrency(stats.balance)}</p>
                <p className="text-xs text-muted-foreground">Số dư quỹ công đoàn</p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#E8F5E9]">
          <TabsTrigger
            value="members"
            className="data-[state=active]:bg-[#1B4D3E] data-[state=active]:text-white"
          >
            Danh sách thành viên
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-[#1B4D3E] data-[state=active]:text-white"
          >
            Giao dịch thu chi
          </TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'members' ? 'Tìm theo mã NV hoặc họ tên...' : 'Tìm kiếm giao dịch...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#F5F5DC]/50 border-[#1B4D3E]/20"
            />
          </div>
        </div>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã NV</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Ngày sinh</TableHead>
                    <TableHead>Quê quán</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead>Ngày kết thúc</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Chưa có thành viên nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id} className={isBirthdayToday(member.birth_date) ? 'bg-pink-100' : isUpcomingBirthday(member.birth_date) ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-medium">{member.member_code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {member.full_name}
                            {isBirthdayToday(member.birth_date) ? (
                              <Badge className="bg-pink-500 text-white hover:bg-pink-500 flex items-center gap-1 animate-pulse">
                                <Cake className="h-3 w-3" />
                                🎂 Hôm nay!
                              </Badge>
                            ) : isUpcomingBirthday(member.birth_date) && (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
                                <Cake className="h-3 w-3" />
                                {getDaysUntilBirthday(member.birth_date)} ngày
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.birth_date ? formatVietnameseDate(member.birth_date) : '-'}
                        </TableCell>
                        <TableCell>{member.hometown || '-'}</TableCell>
                        <TableCell>{formatVietnameseDate(member.join_date)}</TableCell>
                        <TableCell>
                          {member.end_date ? formatVietnameseDate(member.end_date) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleEditMember(member)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => deleteMember.mutate(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Thành viên</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Chưa có giao dịch nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatVietnameseDate(transaction.transaction_date)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              transaction.transaction_type === 'Thu'
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-red-100 text-red-800 hover:bg-red-100'
                            }
                          >
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={
                            transaction.transaction_type === 'Thu' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                          }
                        >
                          {transaction.transaction_type === 'Thu' ? '+' : '-'}
                          {formatCurrency(Number(transaction.amount))}
                        </TableCell>
                        <TableCell>{transaction.member?.full_name || '-'}</TableCell>
                        <TableCell>{transaction.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => deleteTransaction.mutate(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã nhân viên *</Label>
                <Input
                  placeholder="NV001"
                  value={memberForm.member_code}
                  onChange={(e) => setMemberForm({ ...memberForm, member_code: e.target.value })}
                  className="bg-[#F5F5DC]/50"
                  disabled={!!editingMember}
                />
              </div>
              <div className="space-y-2">
                <Label>Họ tên *</Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={memberForm.full_name}
                  onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                  className="bg-[#F5F5DC]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày sinh</Label>
                <Input
                  type="date"
                  value={memberForm.birth_date}
                  onChange={(e) => setMemberForm({ ...memberForm, birth_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quê quán</Label>
                <SearchableSelect
                  options={PROVINCES}
                  value={memberForm.hometown}
                  onValueChange={(v) => setMemberForm({ ...memberForm, hometown: v })}
                  placeholder="Chọn tỉnh/thành"
                  searchPlaceholder="Tìm tỉnh/thành..."
                  emptyText="Không tìm thấy."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày tham gia CĐ *</Label>
                <Input
                  type="date"
                  value={memberForm.join_date}
                  onChange={(e) => setMemberForm({ ...memberForm, join_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={memberForm.end_date}
                  onChange={(e) => setMemberForm({ ...memberForm, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={memberForm.status}
                onValueChange={(value) => setMemberForm({ ...memberForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Đang tham gia">Đang tham gia</SelectItem>
                  <SelectItem value="Đã kết thúc">Đã kết thúc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                placeholder="Ghi chú thêm..."
                value={memberForm.notes}
                onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveMember}
                disabled={createMember.isPending || updateMember.isPending}
                className="bg-[#1B4D3E] hover:bg-[#1B4D3E]/90"
              >
                {editingMember ? 'Lưu thay đổi' : 'Thêm mới'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm giao dịch mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loại giao dịch *</Label>
              <Select
                value={transactionForm.transaction_type}
                onValueChange={(value: 'Thu' | 'Chi') =>
                  setTransactionForm({ ...transactionForm, transaction_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Thu">Thu</SelectItem>
                  <SelectItem value="Chi">Chi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Số tiền (VNĐ) *</Label>
              <Input
                type="number"
                placeholder="100000"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                className="bg-[#F5F5DC]/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Ngày giao dịch *</Label>
              <Input
                type="date"
                value={transactionForm.transaction_date}
                onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Thành viên liên quan</Label>
              <Select
                value={transactionForm.member_id || "none"}
                onValueChange={(value) => setTransactionForm({ ...transactionForm, member_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Không chọn --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Không chọn --</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.member_code} - {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả giao dịch..."
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setTransactionDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleAddTransaction}
                disabled={createTransaction.isPending}
                className="bg-[#1B4D3E] hover:bg-[#1B4D3E]/90"
              >
                Thêm giao dịch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalUnionPage;
