import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useEducationHistory,
  useWorkHistory,
  useFamilyMembers,
  useJapanRelatives,
} from "@/hooks/useTraineeHistory";
import { GraduationCap, Briefcase, Users, Globe } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PersonalHistoryTabProps {
  traineeId: string;
}

export function PersonalHistoryTab({ traineeId }: PersonalHistoryTabProps) {
  const { data: education, isLoading: eduLoading } = useEducationHistory(traineeId);
  const { data: work, isLoading: workLoading } = useWorkHistory(traineeId);
  const { data: family, isLoading: familyLoading } = useFamilyMembers(traineeId);
  const { data: japanRelatives, isLoading: jpLoading } = useJapanRelatives(traineeId);

  return (
    <div className="space-y-6">
      {/* Education History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-primary" />
            Lịch sử học vấn
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eduLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !education || education.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Chưa có thông tin học vấn
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trường / Cơ sở đào tạo</TableHead>
                  <TableHead>Cấp bậc</TableHead>
                  <TableHead>Chuyên ngành</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {education.map((edu) => (
                  <TableRow key={edu.id}>
                    <TableCell className="font-medium">{edu.school_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{edu.level || "—"}</Badge>
                    </TableCell>
                    <TableCell>{edu.major || "—"}</TableCell>
                    <TableCell>
                      {edu.start_year && edu.end_year
                        ? `${edu.start_year} - ${edu.end_year}`
                        : edu.start_year || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Work History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-primary" />
            Lịch sử làm việc
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !work || work.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Chưa có kinh nghiệm làm việc
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Công ty</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {work.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.company_name}</TableCell>
                    <TableCell>{w.position || "—"}</TableCell>
                    <TableCell>
                      {w.start_date && w.end_date
                        ? `${w.start_date} - ${w.end_date}`
                        : w.start_date || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Family Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Thành viên gia đình
          </CardTitle>
        </CardHeader>
        <CardContent>
          {familyLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !family || family.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Chưa có thông tin gia đình
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quan hệ</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Năm sinh</TableHead>
                  <TableHead>Nghề nghiệp</TableHead>
                  <TableHead>Nơi ở</TableHead>
                  <TableHead>Thu nhập</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {family.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Badge variant="secondary">{member.relationship}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell>{member.birth_year || "—"}</TableCell>
                    <TableCell>{member.occupation || "—"}</TableCell>
                    <TableCell>{member.location || "—"}</TableCell>
                    <TableCell>{member.income || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Japan Relatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-red-500" />
            Người thân ở Nhật Bản
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jpLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !japanRelatives || japanRelatives.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Không có người thân ở Nhật Bản
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quan hệ</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Tuổi</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Địa chỉ tại Nhật</TableHead>
                  <TableHead>Tư cách lưu trú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {japanRelatives.map((relative) => (
                  <TableRow key={relative.id}>
                    <TableCell>
                      <Badge variant="secondary">{relative.relationship || "—"}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{relative.full_name}</TableCell>
                    <TableCell>{relative.age || "—"}</TableCell>
                    <TableCell>{relative.gender || "—"}</TableCell>
                    <TableCell>{relative.address_japan || "—"}</TableCell>
                    <TableCell>{relative.residence_status || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
