import { useState } from "react";
import { Languages, Heart, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VocabularyTab from "./tabs/VocabularyTab";
import KatakanaTab from "./tabs/KatakanaTab";
import ReferralSourcesTab from "./tabs/ReferralSourcesTab";
import ReligionsTab from "./tabs/ReligionsTab";
import PolicyCategoriesTab from "./tabs/PolicyCategoriesTab";

const GlossaryPage = () => {
  const [activeTab, setActiveTab] = useState("vocabulary");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Languages className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Từ điển dữ liệu</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý từ vựng, danh mục và các dữ liệu hệ thống
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-0 p-0 h-auto gap-2 flex-wrap">
          <TabsTrigger
            value="vocabulary"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-muted text-muted-foreground px-4 py-2 rounded-full"
          >
            <Languages className="h-4 w-4 mr-2" />
            Từ vựng
          </TabsTrigger>
          <TabsTrigger
            value="katakana"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-muted text-muted-foreground px-4 py-2 rounded-full"
          >
            <span className="mr-2">あ</span>
            Katakana
          </TabsTrigger>
          <TabsTrigger
            value="referral"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-muted text-muted-foreground px-4 py-2 rounded-full"
          >
            <span className="mr-2">📤</span>
            Nguồn giới thiệu
          </TabsTrigger>
          <TabsTrigger
            value="religions"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-muted text-muted-foreground px-4 py-2 rounded-full"
          >
            <Heart className="h-4 w-4 mr-2" />
            Tôn giáo
          </TabsTrigger>
          <TabsTrigger
            value="policy"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-muted text-muted-foreground px-4 py-2 rounded-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            Diện chính sách
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vocabulary" className="mt-6">
          <VocabularyTab />
        </TabsContent>
        <TabsContent value="katakana" className="mt-6">
          <KatakanaTab />
        </TabsContent>
        <TabsContent value="referral" className="mt-6">
          <ReferralSourcesTab />
        </TabsContent>
        <TabsContent value="religions" className="mt-6">
          <ReligionsTab />
        </TabsContent>
        <TabsContent value="policy" className="mt-6">
          <PolicyCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlossaryPage;
