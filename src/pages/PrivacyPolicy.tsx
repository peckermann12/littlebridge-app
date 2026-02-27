import React from "react";
import { useTranslation } from "../i18n";
import type { Locale } from "../i18n";

// ---------------------------------------------------------------------------
// Bilingual content
// ---------------------------------------------------------------------------

interface Section {
  heading: string;
  body: React.ReactNode;
}

function getSections(locale: Locale): Section[] {
  if (locale === "zh") {
    return [
      {
        heading: "1. 我们收集哪些信息",
        body: (
          <>
            <p>
              当您使用小桥（LittleBridge）时，我们可能会收集以下信息：
            </p>
            <ul>
              <li>
                <strong>家庭用户：</strong>姓名、邮箱地址、手机号码、微信号、所在区域/邮编、孩子的姓名和年龄
              </li>
              <li>
                <strong>托儿中心用户：</strong>中心名称、地址、联系方式、ABN、员工语言能力、服务描述
              </li>
              <li>
                <strong>访客咨询：</strong>如果您在未注册的情况下发送咨询，我们会收集您在咨询表单中填写的姓名、邮箱、手机号码、微信号和孩子年龄
              </li>
              <li>
                <strong>自动收集的信息：</strong>浏览器类型、语言偏好、大致访问时间
              </li>
            </ul>
            <p>
              我们只收集为您提供服务所必需的信息。我们不会收集您的身份证件号码、银行卡信息（支付由 Stripe 直接处理）或不必要的个人信息。
            </p>
          </>
        ),
      },
      {
        heading: "2. 我们如何使用您的信息",
        body: (
          <>
            <p>我们使用您的信息来：</p>
            <ul>
              <li>帮助家庭与合适的托儿中心建立联系</li>
              <li>将您的咨询信息翻译成英文或中文，以便对方理解</li>
              <li>根据您孩子的年龄和所在区域，展示适合的托儿中心</li>
              <li>发送与您的咨询相关的通知邮件</li>
              <li>管理托儿中心的订阅服务和账户</li>
              <li>改善我们的平台和用户体验</li>
            </ul>
            <p>
              我们不会将您的信息用于与小桥服务无关的目的，也不会向您发送无关的营销信息。
            </p>
          </>
        ),
      },
      {
        heading: "3. 我们与谁共享您的信息",
        body: (
          <>
            <p>
              我们非常重视您的数据隐私。您的个人信息只会在以下情况下被共享：
            </p>
            <ul>
              <li>
                <strong>您咨询的托儿中心：</strong>当您向某个托儿中心发送咨询时，该中心会收到您的姓名、联系方式和咨询内容。我们只会与您主动联系的那一家中心共享信息，不会将您的信息群发给多个中心。
              </li>
              <li>
                <strong>服务提供商（详见第8节）：</strong>我们使用少数必要的第三方服务来运营平台。每个服务商只会接收到完成其特定功能所需的最少量数据。
              </li>
            </ul>
            <p>
              我们不会出售您的个人信息，也不会将其用于广告投放。
            </p>
          </>
        ),
      },
      {
        heading: "4. 您的数据存储在哪里",
        body: (
          <>
            <p>
              您的数据存储在 Supabase 位于新加坡的亚太地区数据中心。我们选择该区域是因为它是距离澳大利亚最近的可用服务器区域，能确保快速的访问速度。
            </p>
            <p>
              在使用翻译功能时，您的消息文本会被发送到 Anthropic（Claude AI）的 API 进行翻译处理。Anthropic 是一家总部位于美国的人工智能公司。翻译完成后，我们不会要求 Anthropic 保留您的消息内容。
            </p>
            <p>
              支付信息由 Stripe 处理和存储，Stripe 在全球多个地区运营，并符合 PCI DSS 支付安全标准。
            </p>
          </>
        ),
      },
      {
        heading: "5. 儿童信息",
        body: (
          <>
            <p>
              我们收集有关儿童的有限信息（姓名和年龄），但这些信息都是由家长或监护人提供的，而非直接向儿童收集。
            </p>
            <p>
              儿童信息仅用于帮助家庭匹配适龄的托儿服务。我们不会将儿童信息用于任何其他目的，也不会创建儿童的个人档案。
            </p>
            <p>
              当您向托儿中心发送咨询时，孩子的年龄信息会包含在内，以便中心了解您的需求。
            </p>
          </>
        ),
      },
      {
        heading: "6. 您的权利",
        body: (
          <>
            <p>
              根据《澳大利亚隐私法（1988）》和澳大利亚隐私原则（APPs），您有权：
            </p>
            <ul>
              <li>
                <strong>查阅您的数据：</strong>您可以随时请求查看我们所持有的您的个人信息
              </li>
              <li>
                <strong>更正您的数据：</strong>如果您的信息有误或不完整，您可以要求我们更正
              </li>
              <li>
                <strong>删除您的数据：</strong>您可以要求我们删除您的账户及相关个人信息
              </li>
              <li>
                <strong>投诉：</strong>如果您对我们处理您个人信息的方式不满意，您可以向澳大利亚信息专员办公室（OAIC）投诉
              </li>
            </ul>
            <p>
              如需行使以上权利，请发送邮件至{" "}
              <a
                href="mailto:hello@littlebridge.ai"
                className="text-blue-600 hover:underline"
              >
                hello@littlebridge.ai
              </a>
              ，我们会在 30 天内回复。
            </p>
          </>
        ),
      },
      {
        heading: "7. Cookie 和本地存储",
        body: (
          <>
            <p>我们使用少量的 cookie 和浏览器本地存储来：</p>
            <ul>
              <li>
                <strong>语言偏好：</strong>记住您选择的语言（英文或中文），以便下次访问时自动显示
              </li>
              <li>
                <strong>登录会话：</strong>在您登录后保持会话状态，这样您不需要每次都重新登录
              </li>
            </ul>
            <p>
              我们不使用第三方追踪 cookie，也不使用 cookie 进行广告投放或用户行为追踪。
            </p>
          </>
        ),
      },
      {
        heading: "8. 第三方服务",
        body: (
          <>
            <p>
              我们使用以下第三方服务来运营小桥平台。每个服务只接收完成其功能所需的必要信息：
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold">服务</th>
                    <th className="text-left py-2 pr-4 font-semibold">用途</th>
                    <th className="text-left py-2 font-semibold">
                      接收的数据
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Supabase</td>
                    <td className="py-2 pr-4">数据库和用户认证</td>
                    <td className="py-2">所有账户和个人资料数据</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Stripe</td>
                    <td className="py-2 pr-4">支付处理</td>
                    <td className="py-2">
                      托儿中心的邮箱和支付信息（家庭用户无需付费）
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Anthropic (Claude AI)</td>
                    <td className="py-2 pr-4">消息翻译</td>
                    <td className="py-2">
                      咨询消息的文本内容（用于中英翻译）
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Resend</td>
                    <td className="py-2 pr-4">邮件发送</td>
                    <td className="py-2">邮箱地址和邮件内容</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Cloudflare</td>
                    <td className="py-2 pr-4">CDN 和安全防护</td>
                    <td className="py-2">IP 地址和网页请求数据</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              以上每个服务都有各自的隐私政策。我们建议您在需要时查阅。
            </p>
          </>
        ),
      },
      {
        heading: "9. 本政策的变更",
        body: (
          <p>
            如果我们对本隐私政策做出重大更改，我们会在平台上发布更新通知，并更新页面顶部的"最后更新"日期。如果变更涉及我们使用您个人信息的方式，我们还会通过邮件通知您。
          </p>
        ),
      },
      {
        heading: "10. 联系我们",
        body: (
          <>
            <p>
              如果您对本隐私政策有任何疑问，或者想行使您的数据权利，请联系我们：
            </p>
            <ul>
              <li>
                <strong>邮箱：</strong>{" "}
                <a
                  href="mailto:hello@littlebridge.ai"
                  className="text-blue-600 hover:underline"
                >
                  hello@littlebridge.ai
                </a>
              </li>
              <li>
                <strong>运营主体：</strong>LittleBridge（小桥），位于澳大利亚
              </li>
            </ul>
            <p>
              如果您对我们的回复不满意，您可以向澳大利亚信息专员办公室（OAIC）投诉：
              <br />
              <a
                href="https://www.oaic.gov.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                www.oaic.gov.au
              </a>
            </p>
          </>
        ),
      },
    ];
  }

  // English
  return [
    {
      heading: "1. What information we collect",
      body: (
        <>
          <p>When you use LittleBridge, we may collect the following information:</p>
          <ul>
            <li>
              <strong>Family users:</strong> Name, email address, phone number,
              WeChat ID, suburb/postcode, children's names and ages
            </li>
            <li>
              <strong>Center users:</strong> Center name, address, contact
              details, ABN, staff language capabilities, service descriptions
            </li>
            <li>
              <strong>Guest enquiries:</strong> If you send an enquiry without
              creating an account, we collect the name, email, phone number,
              WeChat ID, and child's age you provide in the enquiry form
            </li>
            <li>
              <strong>Automatically collected:</strong> Browser type, language
              preference, approximate visit times
            </li>
          </ul>
          <p>
            We only collect information that is necessary to provide our
            service. We do not collect identity document numbers, bank card
            details (payments are handled directly by Stripe), or unnecessary
            personal information.
          </p>
        </>
      ),
    },
    {
      heading: "2. How we use your information",
      body: (
        <>
          <p>We use your information to:</p>
          <ul>
            <li>Help families connect with suitable childcare centers</li>
            <li>
              Translate your enquiry messages into English or Chinese so the
              other party can understand them
            </li>
            <li>
              Show you relevant childcare centers based on your children's ages
              and location
            </li>
            <li>Send you notification emails related to your enquiries</li>
            <li>Manage center subscriptions and accounts</li>
            <li>Improve our platform and user experience</li>
          </ul>
          <p>
            We will not use your information for purposes unrelated to the
            LittleBridge service, and we will not send you unrelated marketing
            communications.
          </p>
        </>
      ),
    },
    {
      heading: "3. Who we share your information with",
      body: (
        <>
          <p>
            We take your data privacy seriously. Your personal information is
            only shared in the following situations:
          </p>
          <ul>
            <li>
              <strong>The center you contact:</strong> When you send an enquiry
              to a childcare center, that center receives your name, contact
              details, and enquiry message. We only share your information with
              the specific center you choose to contact — we never send your
              details to multiple centers without your action.
            </li>
            <li>
              <strong>Service providers (see Section 8):</strong> We use a small
              number of third-party services to run the platform. Each provider
              only receives the minimum data needed to perform its specific
              function.
            </li>
          </ul>
          <p>
            We do not sell your personal information, and we do not use it for
            advertising.
          </p>
        </>
      ),
    },
    {
      heading: "4. Where your data is stored",
      body: (
        <>
          <p>
            Your data is stored in Supabase's Asia-Pacific data center located
            in Singapore. We chose this region because it is the closest
            available server region to Australia, providing fast access speeds
            for our users.
          </p>
          <p>
            When you use the translation feature, your message text is sent to
            Anthropic's (Claude AI) API for translation processing. Anthropic is
            a US-based artificial intelligence company. After translation is
            complete, we do not request that Anthropic retain your message
            content.
          </p>
          <p>
            Payment information is processed and stored by Stripe, which
            operates across multiple global regions and is PCI DSS compliant.
          </p>
        </>
      ),
    },
    {
      heading: "5. Children's information",
      body: (
        <>
          <p>
            We collect limited information about children (names and ages), but
            this information is always provided by parents or guardians — never
            collected directly from children.
          </p>
          <p>
            Children's information is used solely to help families match with
            age-appropriate childcare services. We do not use children's
            information for any other purpose, and we do not create individual
            profiles for children.
          </p>
          <p>
            When you send an enquiry to a childcare center, your child's age
            information is included so the center can understand your needs.
          </p>
        </>
      ),
    },
    {
      heading: "6. Your rights",
      body: (
        <>
          <p>
            Under the Australian Privacy Act 1988 and the Australian Privacy
            Principles (APPs), you have the right to:
          </p>
          <ul>
            <li>
              <strong>Access your data:</strong> You can request to see the
              personal information we hold about you at any time
            </li>
            <li>
              <strong>Correct your data:</strong> If your information is
              inaccurate or incomplete, you can ask us to correct it
            </li>
            <li>
              <strong>Delete your data:</strong> You can request that we delete
              your account and associated personal information
            </li>
            <li>
              <strong>Complain:</strong> If you are unhappy with how we handle
              your personal information, you can lodge a complaint with the
              Office of the Australian Information Commissioner (OAIC)
            </li>
          </ul>
          <p>
            To exercise any of these rights, please email{" "}
            <a
              href="mailto:hello@littlebridge.ai"
              className="text-blue-600 hover:underline"
            >
              hello@littlebridge.ai
            </a>{" "}
            and we will respond within 30 days.
          </p>
        </>
      ),
    },
    {
      heading: "7. Cookies and local storage",
      body: (
        <>
          <p>We use a small number of cookies and browser local storage to:</p>
          <ul>
            <li>
              <strong>Language preference:</strong> Remember your chosen language
              (English or Chinese) so it displays automatically on your next
              visit
            </li>
            <li>
              <strong>Authentication session:</strong> Keep you signed in after
              you log in, so you don't need to sign in again each time
            </li>
          </ul>
          <p>
            We do not use third-party tracking cookies, and we do not use
            cookies for advertising or behavioural tracking.
          </p>
        </>
      ),
    },
    {
      heading: "8. Third-party services",
      body: (
        <>
          <p>
            We use the following third-party services to operate the LittleBridge
            platform. Each service only receives the data necessary to perform
            its function:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-semibold">Service</th>
                  <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                  <th className="text-left py-2 font-semibold">
                    Data received
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4">Supabase</td>
                  <td className="py-2 pr-4">Database and authentication</td>
                  <td className="py-2">All account and profile data</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4">Stripe</td>
                  <td className="py-2 pr-4">Payment processing</td>
                  <td className="py-2">
                    Center email and payment information (families do not pay)
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4">Anthropic (Claude AI)</td>
                  <td className="py-2 pr-4">Message translation</td>
                  <td className="py-2">
                    Enquiry message text (for Chinese-English translation)
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4">Resend</td>
                  <td className="py-2 pr-4">Email delivery</td>
                  <td className="py-2">Email addresses and email content</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Cloudflare</td>
                  <td className="py-2 pr-4">CDN and security</td>
                  <td className="py-2">IP addresses and web request data</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            Each of these services has its own privacy policy. We encourage you
            to review them if needed.
          </p>
        </>
      ),
    },
    {
      heading: "9. Changes to this policy",
      body: (
        <p>
          If we make significant changes to this privacy policy, we will post an
          update notice on the platform and update the "Last updated" date at the
          top of this page. If the changes affect how we use your personal
          information, we will also notify you by email.
        </p>
      ),
    },
    {
      heading: "10. Contact us",
      body: (
        <>
          <p>
            If you have any questions about this privacy policy, or if you would
            like to exercise your data rights, please contact us:
          </p>
          <ul>
            <li>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:hello@littlebridge.ai"
                className="text-blue-600 hover:underline"
              >
                hello@littlebridge.ai
              </a>
            </li>
            <li>
              <strong>Operated by:</strong> LittleBridge, based in Australia
            </li>
          </ul>
          <p>
            If you are not satisfied with our response, you can lodge a complaint
            with the Office of the Australian Information Commissioner (OAIC):
            <br />
            <a
              href="https://www.oaic.gov.au"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              www.oaic.gov.au
            </a>
          </p>
        </>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PrivacyPolicy(): React.ReactElement {
  const { locale, setLocale } = useTranslation();
  const sections = getSections(locale);

  const title = locale === "zh" ? "隐私政策" : "Privacy Policy";
  const lastUpdated =
    locale === "zh" ? "最后更新：2026年3月" : "Last updated: March 2026";
  const backLabel = locale === "zh" ? "返回首页" : "Back to Home";

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Language toggle */}
      <div className="flex justify-end mb-8">
        <div className="inline-flex rounded-md overflow-hidden border border-gray-200">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`px-4 py-2 text-sm font-medium min-h-[44px] transition-colors ${
              locale === "en"
                ? "bg-blue-600 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale("zh")}
            className={`px-4 py-2 text-sm font-medium min-h-[44px] transition-colors ${
              locale === "zh"
                ? "bg-blue-600 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            中文
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500 mt-2">{lastUpdated}</p>
        {locale === "en" ? (
          <p className="text-gray-600 mt-4">
            LittleBridge is a bilingual childcare marketplace that connects
            Mandarin-speaking families with childcare centers in Australia. This
            policy explains what data we collect, why we collect it, and how we
            look after it. We've tried to keep it clear and readable — if
            anything is unclear, please reach out.
          </p>
        ) : (
          <p className="text-gray-600 mt-4">
            小桥（LittleBridge）是一个双语托儿服务平台，帮助华人家庭在澳大利亚找到合适的托儿中心。本政策说明了我们收集哪些数据、为什么收集以及如何保护这些数据。我们尽量用简明的语言来说明——如果有任何不清楚的地方，欢迎随时联系我们。
          </p>
        )}
      </header>

      {/* Sections */}
      <div className="prose prose-gray max-w-none">
        {sections.map((section, index) => (
          <section key={index} className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {section.heading}
            </h2>
            <div className="text-gray-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-gray-600">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      {/* Back to Home */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <a
          href="/"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          &larr; {backLabel}
        </a>
      </div>
    </div>
  );
}
