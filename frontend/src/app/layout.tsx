import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { UserProvider } from "@/components/user-provider";

export const metadata: Metadata = {
  title: "世界杯赛事信息与互动预测平台",
  description: "足球赛事信息服务平台，赛程浏览、积分榜、比分预测与评论互动",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <UserProvider>
          <NavBar />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
