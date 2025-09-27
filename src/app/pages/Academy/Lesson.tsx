import React from "react";
import { useParams, Link } from "react-router-dom";

/**
 * Lesson page displays details for a single financial literacy lesson.
 * The content here is purely illustrative and can be replaced with real
 * educational material. The lesson id is taken from the URL params.
 */
export default function LessonPage() {
  const { id } = useParams<{ id: string }>();

  // Define a simple map of lesson details. In a real application you might
  // fetch this from a backend or CMS. Each lesson includes a title and
  // sections with headings and text. You can expand this structure as needed.
  const lessonMap: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
    budget: {
      title: "Бюджет 50/30/20",
      sections: [
        {
          heading: "Суть метода",
          text: "Метод 50/30/20 предполагает, что вы делите свой ежемесячный доход на три части: 50 % идёт на обязательные расходы (жильё, питание, транспорт), 30 % — на личные желания и удовольствия, 20 % — на накопления и инвестиции.",
        },
        {
          heading: "Преимущества",
          text: "Такой подход позволяет держать расходы под контролем, не отказываясь от удовольствий, и при этом регулярно откладывать средства на будущее.",
        },
        {
          heading: "Как начать",
          text: "Составьте список всех обязательных платежей, определите сумму на личные траты и установите автоматический перевод 20 % дохода на сберегательный счёт.",
        },
      ],
    },
    etf: {
      title: "Что такое ETF",
      sections: [
        {
          heading: "Определение",
          text: "ETF (exchange‑traded fund) — это биржевой инвестиционный фонд, который формируется из набора активов (акции, облигации, товары) и торгуется на бирже как одна ценная бумага.",
        },
        {
          heading: "Плюсы ETF",
          text: "Инвестируя в ETF, вы получаете диверсификацию (ваши деньги распределены между многими активами), низкие комиссии и прозрачность структуры фонда.",
        },
        {
          heading: "Риски",
          text: "Как и любой инвестиционный инструмент, ETF подвержены рыночным рискам. Доходность не гарантирована и зависит от стоимости входящих активов.",
        },
      ],
    },
    emergency: {
      title: "Подушка безопасности",
      sections: [
        {
          heading: "Зачем нужна",
          text: "Финансовая подушка безопасности — это резервный фонд, который поможет вам справиться с непредвиденными расходами: потерей работы, болезнью, ремонтом и т. п.",
        },
        {
          heading: "Размер подушки",
          text: "Рекомендуется иметь запас средств на 3–6 месяцев ваших обязательных расходов. Эта сумма позволит вам чувствовать себя уверенно в случае кризиса.",
        },
        {
          heading: "Где хранить",
          text: "Лучше всего держать подушку на отдельном сберегательном счёте с возможностью быстрого доступа. Не используйте высокорисковые инструменты для этих средств.",
        },
      ],
    },
    credit: {
      title: "Как пользоваться кредитами с умом",
      sections: [
        {
          heading: "Когда кредит оправдан",
          text: "Кредит полезен для крупных покупок (жильё, образование), если у вас стабильный доход и вы способны выплачивать долг без ущерба для бюджета.",
        },
        {
          heading: "Условия кредита",
          text: "Всегда обращайте внимание на полную стоимость кредита, включая процентную ставку, комиссии и страховку. Сравнивайте предложения разных банков.",
        },
        {
          heading: "Как не попасть в долговую яму",
          text: "Не берите несколько кредитов одновременно, избегайте просрочек, не занимайте на вещи, без которых можно обойтись. Планируйте выплаты заранее.",
        },
      ],
    },
    deposits: {
      title: "Накопительные счета и вклады",
      sections: [
        {
          heading: "Разница",
          text: "Накопительный счёт позволяет пополнять и снимать деньги в любой момент, обычно с плавающей ставкой. Вклад фиксируется на определённый срок и часто имеет более высокую ставку.",
        },
        {
          heading: "Как выбирать",
          text: "Сравнивайте процентные ставки, условия пополнения и снятия, наличие капитализации процентов и возможность частичного снятия без потери доходности.",
        },
        {
          heading: "Совет",
          text: "Разделяйте деньги: часть держите на накопительном счёте для резерва, а часть размещайте во вклады для более высокой доходности.",
        },
      ],
    },
  };

  const lesson = id ? lessonMap[id] : undefined;

  if (!lesson) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-lg font-semibold">Урок не найден</h1>
        <Link to="/academy" className="text-blue-600 hover:underline">
          Вернуться в академию
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <Link to="/academy" className="text-blue-600 hover:underline text-sm">
        ← Назад к академии
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">{lesson.title}</h1>
      {lesson.sections.map((section, index) => (
        <section key={index} className="space-y-2">
          <h2 className="text-lg font-medium text-slate-800">{section.heading}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {section.text}
          </p>
        </section>
      ))}
    </div>
  );
}