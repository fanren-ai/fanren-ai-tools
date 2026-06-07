import Link from "next/link";

// 站点底部信息（沿用主站 www.fanrenai.cn 的底部内容）
export default function SiteFooter() {
  return (
    <footer
      className="px-6 py-10 border-t mt-6"
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-3 text-center text-sm">
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          ➕ 提交工具
        </Link>

        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <a
            href="https://www.fanrenai.cn/community/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            社区
          </a>
          <span>·</span>
          <Link href="/submit" className="hover:underline">
            提交工具
          </Link>
          <span>·</span>
          <span>普通人的 AI 学习与实践平台</span>
        </p>

        <p style={{ opacity: 0.8 }}>
          凡人修AI © 2026 ·{" "}
          <a
            href="https://www.fanrenai.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            www.fanrenai.cn
          </a>
        </p>

        {/* 免责声明 */}
        <details className="w-full max-w-3xl mt-2 text-left">
          <summary
            className="cursor-pointer text-center select-none hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            免责声明
          </summary>
          <p
            className="mt-2 text-xs leading-6 px-1"
            style={{ color: "var(--text-secondary)", opacity: 0.85 }}
          >
            本站（凡人修AI工具箱）是一个 AI
            工具信息导航与分享平台，所收录的工具名称、图标及简介均整理自互联网公开信息，仅供学习与交流参考，不代表本站立场。本站不直接提供相关工具的产品或服务，亦不对其内容、功能、可用性、安全性及准确性作任何明示或暗示的保证；您因访问或使用任何第三方工具所产生的风险与责任，由您自行承担。各工具的名称、商标、Logo
            及版权均归其各自所有者所有。如涉及侵权或信息有误，请通过{" "}
            <a
              href="https://www.fanrenai.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--accent-light)" }}
            >
              www.fanrenai.cn
            </a>{" "}
            联系我们，我们将及时核实并予以更正或删除。
          </p>
        </details>
      </div>
    </footer>
  );
}
