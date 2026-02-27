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
        heading: "1. 小桥是什么",
        body: (
          <>
            <p>
              小桥（LittleBridge）是一个双语托儿服务信息平台，帮助华人家庭与澳大利亚的托儿中心建立联系。
            </p>
            <p>请您理解以下重要事项：</p>
            <ul>
              <li>
                <strong>小桥不是托儿服务提供者。</strong>我们不直接提供托儿服务，不运营任何托儿中心，也不雇佣任何教育工作者。
              </li>
              <li>
                <strong>小桥不是职业中介。</strong>我们不充当雇主或劳务中介的角色。
              </li>
              <li>
                <strong>小桥是一个信息撮合平台。</strong>我们的作用是帮助家庭找到合适的托儿中心，并为双方提供沟通的渠道。实际的托儿服务关系由家庭和托儿中心之间直接建立。
              </li>
            </ul>
            <p>
              使用小桥即表示您同意本服务条款。如果您不同意这些条款，请停止使用本平台。
            </p>
          </>
        ),
      },
      {
        heading: "2. 用户账户和责任",
        body: (
          <>
            <p>注册小桥账户时，您同意：</p>
            <ul>
              <li>提供真实、准确的个人信息</li>
              <li>保管好您的账户密码，不与他人共享</li>
              <li>对您账户下发生的所有活动负责</li>
              <li>如发现账户被未经授权使用，请立即通知我们</li>
            </ul>
            <p>
              您也可以在不注册的情况下以访客身份发送咨询，此时您需要为所提供信息的真实性负责。
            </p>
          </>
        ),
      },
      {
        heading: "3. 托儿中心订阅和付款",
        body: (
          <>
            <p>
              <strong>家庭用户：</strong>使用小桥搜索托儿中心和发送咨询完全免费。
            </p>
            <p>
              <strong>托儿中心用户：</strong>托儿中心可以通过付费订阅在小桥上展示信息并接收家庭咨询。
            </p>
            <ul>
              <li>
                <strong>费用：</strong>99澳元/月（含GST）
              </li>
              <li>
                <strong>免费试用：</strong>新注册的中心享有30天免费试用期
              </li>
              <li>
                <strong>付款方式：</strong>通过 Stripe 安全处理信用卡或借记卡付款
              </li>
              <li>
                <strong>取消订阅：</strong>您可以随时通过 Stripe
                客户门户取消订阅。取消后，您的服务将持续到当前计费周期结束
              </li>
              <li>
                <strong>退款：</strong>取消后不提供当月已付费用的退款，但您可以继续使用至计费周期结束
              </li>
            </ul>
            <p>
              我们保留在提前通知的情况下调整订阅价格的权利。价格变更将从您的下一个计费周期开始生效。
            </p>
          </>
        ),
      },
      {
        heading: "4. 内容和翻译",
        body: (
          <>
            <p>
              小桥使用人工智能技术（Anthropic Claude）来翻译家庭与托儿中心之间的咨询消息。关于翻译服务，请注意：
            </p>
            <ul>
              <li>
                <strong>翻译不保证完全准确。</strong>AI
                翻译可能存在用词不精确或语境理解偏差的情况。重要事项请以原文为准，必要时建议通过其他方式确认。
              </li>
              <li>
                <strong>原文始终保留。</strong>收件方可以同时看到原文和翻译版本。
              </li>
              <li>
                <strong>翻译由第三方 AI 处理。</strong>您的消息文本会被发送到
                Anthropic 的 API 进行翻译。请参阅我们的
                <a href="/privacy" className="text-blue-600 hover:underline">
                  隐私政策
                </a>
                了解详情。
              </li>
            </ul>
            <p>
              您对自己发布的内容负全部责任，包括咨询消息、个人资料信息和中心描述。
            </p>
          </>
        ),
      },
      {
        heading: "5. WWCC 和资质信息",
        body: (
          <>
            <p>
              托儿中心和教育工作者可能会在小桥平台上展示其持有的
              Working With Children Check（WWCC）以及相关专业资质信息。关于这些信息，请特别注意：
            </p>
            <ul>
              <li>
                <strong>小桥不核实这些信息。</strong>所有 WWCC
                编号、资质证书和工作经验均为用户自行填报，小桥不对其真实性或有效性进行验证。
              </li>
              <li>
                <strong>家庭有权自行核实。</strong>我们建议家庭在做出托儿决定之前，自行向相关部门核实中心或教育工作者的资质和合规情况。
              </li>
              <li>
                <strong>托儿中心自行负责合规。</strong>每个托儿中心需自行确保遵守所有适用的法律法规，包括员工的
                WWCC、资质要求和监管标准。
              </li>
            </ul>
            <p>
              小桥平台上显示的 WWCC
              或资质信息不构成任何形式的背书、保证或推荐。
            </p>
          </>
        ),
      },
      {
        heading: "6. 责任限制",
        body: (
          <>
            <p>
              小桥是一个信息撮合平台，不直接参与家庭与托儿中心之间的服务关系。因此：
            </p>
            <ul>
              <li>
                我们不对任何托儿中心提供的托儿服务的质量、安全性或合规性负责
              </li>
              <li>我们不对用户之间的互动、协议或纠纷负责</li>
              <li>
                我们不对 AI 翻译的准确性或由翻译导致的误解负责
              </li>
              <li>
                我们不对用户自行填报的信息（包括 WWCC 和资质信息）的真实性负责
              </li>
            </ul>
            <p>
              在法律允许的范围内，小桥对因使用本平台而产生的任何直接、间接、附带或后果性损失不承担责任。我们的最大责任不超过您在过去12个月内向小桥支付的费用总额。
            </p>
            <p>
              本条款不排除或限制任何根据澳大利亚消费者法不可排除的权利。
            </p>
          </>
        ),
      },
      {
        heading: "7. 使用规范",
        body: (
          <>
            <p>使用小桥时，您同意不会：</p>
            <ul>
              <li>创建虚假身份或提供虚假信息</li>
              <li>发送垃圾信息、骚扰信息或不当内容</li>
              <li>发布含有歧视性、仇恨性或冒犯性内容的信息</li>
              <li>利用平台进行与托儿服务无关的商业推广</li>
              <li>尝试未经授权访问其他用户的账户或数据</li>
              <li>采集、抓取或大量复制平台上的内容</li>
              <li>规避或干扰平台的安全措施</li>
            </ul>
          </>
        ),
      },
      {
        heading: "8. 账户终止",
        body: (
          <>
            <p>
              <strong>您可以随时终止：</strong>您可以随时联系我们删除您的账户，或通过
              Stripe 门户取消您的订阅。
            </p>
            <p>
              <strong>我们可能会暂停或终止账户：</strong>如果我们有合理理由认为您违反了本服务条款，我们保留暂停或终止您账户的权利，包括但不限于：
            </p>
            <ul>
              <li>提供虚假信息</li>
              <li>违反使用规范</li>
              <li>从事欺诈或非法活动</li>
              <li>对其他用户造成骚扰</li>
            </ul>
            <p>
              在可能的情况下，我们会在采取行动之前通知您，并给您解释或纠正的机会。紧急情况下，我们可能会立即暂停账户。
            </p>
          </>
        ),
      },
      {
        heading: "9. 适用法律",
        body: (
          <p>
            本服务条款受澳大利亚新南威尔士州法律管辖，并按其法律解释。与本条款相关的任何争议应提交至新南威尔士州法院管辖。
          </p>
        ),
      },
      {
        heading: "10. 联系我们",
        body: (
          <>
            <p>
              如果您对本服务条款有任何疑问，请联系我们：
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
          </>
        ),
      },
    ];
  }

  // English
  return [
    {
      heading: "1. What LittleBridge is",
      body: (
        <>
          <p>
            LittleBridge is a bilingual childcare marketplace that connects
            Mandarin-speaking families with childcare centers in Australia.
          </p>
          <p>Please understand the following important points:</p>
          <ul>
            <li>
              <strong>LittleBridge is not a childcare provider.</strong> We do
              not provide childcare services directly, operate any childcare
              centers, or employ any educators.
            </li>
            <li>
              <strong>LittleBridge is not an employment agent.</strong> We do not
              act as an employer or recruitment agency.
            </li>
            <li>
              <strong>LittleBridge is a marketplace facilitator.</strong> Our
              role is to help families find suitable childcare centers and
              provide a communication channel between both parties. The actual
              childcare relationship is established directly between the family
              and the center.
            </li>
          </ul>
          <p>
            By using LittleBridge, you agree to these Terms of Service. If you
            do not agree, please stop using the platform.
          </p>
        </>
      ),
    },
    {
      heading: "2. User accounts and responsibilities",
      body: (
        <>
          <p>When you register a LittleBridge account, you agree to:</p>
          <ul>
            <li>Provide truthful and accurate personal information</li>
            <li>
              Keep your account password secure and not share it with others
            </li>
            <li>
              Be responsible for all activity that occurs under your account
            </li>
            <li>
              Notify us immediately if you discover any unauthorised use of your
              account
            </li>
          </ul>
          <p>
            You may also send enquiries as a guest without registering. In this
            case, you are responsible for the accuracy of the information you
            provide.
          </p>
        </>
      ),
    },
    {
      heading: "3. Center subscriptions and payment terms",
      body: (
        <>
          <p>
            <strong>For families:</strong> Searching for childcare centers and
            sending enquiries on LittleBridge is completely free.
          </p>
          <p>
            <strong>For childcare centers:</strong> Centers can subscribe to
            display their information on LittleBridge and receive family
            enquiries.
          </p>
          <ul>
            <li>
              <strong>Price:</strong> $99 AUD/month (including GST)
            </li>
            <li>
              <strong>Free trial:</strong> New centers receive a 30-day free
              trial
            </li>
            <li>
              <strong>Payment method:</strong> Credit or debit card payments
              processed securely via Stripe
            </li>
            <li>
              <strong>Cancellation:</strong> You can cancel your subscription at
              any time through the Stripe customer portal. After cancellation,
              your service continues until the end of the current billing cycle
            </li>
            <li>
              <strong>Refunds:</strong> No refunds are provided for the current
              billing period after cancellation, but you may continue using the
              service until the cycle ends
            </li>
          </ul>
          <p>
            We reserve the right to adjust subscription pricing with advance
            notice. Price changes take effect at the start of your next billing
            cycle.
          </p>
        </>
      ),
    },
    {
      heading: "4. Content and translations",
      body: (
        <>
          <p>
            LittleBridge uses artificial intelligence (Anthropic Claude) to
            translate enquiry messages between families and childcare centers.
            Please note the following about the translation service:
          </p>
          <ul>
            <li>
              <strong>Translations are not guaranteed to be fully accurate.</strong>{" "}
              AI translation may contain imprecise wording or contextual
              misunderstandings. For important matters, please refer to the
              original text and consider confirming through other means if
              necessary.
            </li>
            <li>
              <strong>The original text is always preserved.</strong> Recipients
              can see both the original message and the translated version.
            </li>
            <li>
              <strong>Translation is processed by a third-party AI.</strong> Your
              message text is sent to Anthropic's API for translation. See our{" "}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>{" "}
              for details.
            </li>
          </ul>
          <p>
            You are fully responsible for the content you post, including
            enquiry messages, profile information, and center descriptions.
          </p>
        </>
      ),
    },
    {
      heading: "5. WWCC and qualifications",
      body: (
        <>
          <p>
            Childcare centers and educators may display their Working With
            Children Check (WWCC) and professional qualifications on the
            LittleBridge platform. Please note the following:
          </p>
          <ul>
            <li>
              <strong>LittleBridge does not verify this information.</strong> All
              WWCC numbers, qualifications, and experience details are
              self-reported by users. LittleBridge does not verify their
              authenticity or validity.
            </li>
            <li>
              <strong>Families are encouraged to verify independently.</strong>{" "}
              We recommend that families independently verify the credentials
              and compliance status of any center or educator before making
              childcare decisions.
            </li>
            <li>
              <strong>
                Centers are responsible for their own compliance.
              </strong>{" "}
              Each childcare center is solely responsible for ensuring compliance
              with all applicable laws and regulations, including staff WWCC,
              qualification requirements, and regulatory standards.
            </li>
          </ul>
          <p>
            The display of WWCC or qualification information on LittleBridge
            does not constitute any form of endorsement, guarantee, or
            recommendation.
          </p>
        </>
      ),
    },
    {
      heading: "6. Limitation of liability",
      body: (
        <>
          <p>
            LittleBridge is a marketplace facilitator and is not directly
            involved in the service relationship between families and childcare
            centers. Accordingly:
          </p>
          <ul>
            <li>
              We are not responsible for the quality, safety, or regulatory
              compliance of childcare services provided by any center
            </li>
            <li>
              We are not responsible for interactions, agreements, or disputes
              between users
            </li>
            <li>
              We are not responsible for the accuracy of AI translations or
              misunderstandings arising from translations
            </li>
            <li>
              We are not responsible for the accuracy of self-reported
              information, including WWCC and qualification details
            </li>
          </ul>
          <p>
            To the maximum extent permitted by law, LittleBridge is not liable
            for any direct, indirect, incidental, or consequential loss or
            damage arising from the use of this platform. Our maximum liability
            does not exceed the total fees you have paid to LittleBridge in the
            preceding 12 months.
          </p>
          <p>
            Nothing in these terms excludes or limits any rights that cannot be
            excluded under Australian Consumer Law.
          </p>
        </>
      ),
    },
    {
      heading: "7. Acceptable use",
      body: (
        <>
          <p>When using LittleBridge, you agree not to:</p>
          <ul>
            <li>Create fake identities or provide false information</li>
            <li>Send spam, harassing messages, or inappropriate content</li>
            <li>
              Post content that is discriminatory, hateful, or offensive
            </li>
            <li>
              Use the platform for commercial promotion unrelated to childcare
              services
            </li>
            <li>
              Attempt to gain unauthorised access to other users' accounts or
              data
            </li>
            <li>Scrape, crawl, or bulk-copy content from the platform</li>
            <li>
              Circumvent or interfere with the platform's security measures
            </li>
          </ul>
        </>
      ),
    },
    {
      heading: "8. Termination",
      body: (
        <>
          <p>
            <strong>You can terminate at any time:</strong> You can contact us to
            delete your account, or cancel your subscription through the Stripe
            portal.
          </p>
          <p>
            <strong>We may suspend or terminate accounts:</strong> If we have
            reasonable grounds to believe you have violated these Terms of
            Service, we reserve the right to suspend or terminate your account,
            including but not limited to:
          </p>
          <ul>
            <li>Providing false information</li>
            <li>Violating the acceptable use policy</li>
            <li>Engaging in fraudulent or illegal activity</li>
            <li>Harassing other users</li>
          </ul>
          <p>
            Where possible, we will notify you before taking action and give you
            the opportunity to explain or rectify the situation. In urgent
            circumstances, we may suspend accounts immediately.
          </p>
        </>
      ),
    },
    {
      heading: "9. Governing law",
      body: (
        <p>
          These Terms of Service are governed by and construed in accordance with
          the laws of New South Wales, Australia. Any disputes relating to these
          terms shall be subject to the jurisdiction of the courts of New South
          Wales.
        </p>
      ),
    },
    {
      heading: "10. Contact us",
      body: (
        <>
          <p>
            If you have any questions about these Terms of Service, please
            contact us:
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
        </>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TermsOfService(): React.ReactElement {
  const { locale, setLocale } = useTranslation();
  const sections = getSections(locale);

  const title = locale === "zh" ? "服务条款" : "Terms of Service";
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
            These terms govern your use of LittleBridge, a bilingual childcare
            marketplace connecting Mandarin-speaking families with childcare
            centers in Australia. We've written them as clearly as we can — if
            you have questions, please get in touch.
          </p>
        ) : (
          <p className="text-gray-600 mt-4">
            本条款适用于您对小桥（LittleBridge）的使用。小桥是一个双语托儿服务信息平台，帮助华人家庭在澳大利亚找到合适的托儿中心。我们尽量用清晰易懂的语言编写了这些条款——如有疑问，欢迎随时联系我们。
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
