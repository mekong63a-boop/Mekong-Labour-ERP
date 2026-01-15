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
import { Plus, Search, Users, TrendingUp, TrendingDown, Wallet, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  useUnionMembers,
  useUnionTransactions,
  useUnionStats,
  useCreateUnionMember,
  useCreateUnionTransaction,
  useDeleteUnionMember,
  useDeleteUnionTransaction,
  UnionMember,
} from '@/hooks/useInternalUnion';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const InternalUnionPage = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  const { data: members = [], isLoading: membersLoading } = useUnionMembers();
  const { data: transactions = [], isLoading: transactionsLoading } = useUnionTransactions();
  const stats = useUnionStats();

  const createMember = useCreateUnionMember();
  const createTransaction = useCreateUnionTransaction();
  const deleteMember = useDeleteUnionMember();
  const deleteTransaction = useDeleteUnionTransaction();

  // Member form state
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

  const filteredMembers = members.filter(
    (member) =>
      member.member_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(
    (t) =>
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.member?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = async () => {
    if (!memberForm.member_code || !memberForm.full_name) {
      return;
    }

    await createMember.mutateAsync({
      member_code: memberForm.member_code,
      full_name: memberForm.full_name,
      birth_date: memberForm.birth_date || null,
      hometown: memberForm.hometown || null,
      join_date: memberForm.join_date,
      end_date: memberForm.end_date || null,
      status: memberForm.status,
      notes: memberForm.notes || null,
    });

    setMemberDialogOpen(false);
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
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.member_code}</TableCell>
                        <TableCell>{member.full_name}</TableCell>
                        <TableCell>
                          {member.birth_date ? format(new Date(member.birth_date), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>{member.hometown || '-'}</TableCell>
                        <TableCell>{format(new Date(member.join_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          {member.end_date ? format(new Date(member.end_date), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => deleteMember.mutate(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                        <TableCell>{format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}</TableCell>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => deleteTransaction.mutate(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm thành viên mới</DialogTitle>
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
                <Input
                  placeholder="Hà Nội"
                  value={memberForm.hometown}
                  onChange={(e) => setMemberForm({ ...memberForm, hometown: e.target.value })}
                  className="bg-[#F5F5DC]/50"
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
              <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={createMember.isPending}
                className="bg-[#1B4D3E] hover:bg-[#1B4D3E]/90"
              >
                Thêm mới
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
                value={transactionForm.member_id}
                onValueChange={(value) => setTransactionForm({ ...transactionForm, member_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Không chọn --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Không chọn --</SelectItem>
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
