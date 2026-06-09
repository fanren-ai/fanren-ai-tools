import HomeClient from "./HomeClient";
import { getCatalog } from "@/lib/toolsStore";
import { getSiteConfig } from "@/lib/siteConfig";

// ISR：后台编辑工具/配置后，前台最多 60 秒自动更新（也可被 revalidatePath 即时刷新）
export const revalidate = 60;

export default async function Page() {
  const [{ categories, allTools }, config] = await Promise.all([
    getCatalog(),
    getSiteConfig(),
  ]);
  return (
    <HomeClient categories={categories} allTools={allTools} config={config} />
  );
}
