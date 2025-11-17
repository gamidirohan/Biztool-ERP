import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "Is BizTool really free to start?",
    answer: "Yes! Our Starter plan is completely free forever. You can start with up to 5 team members and basic modules. No credit card required.",
    value: "item-1",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the charges accordingly.",
    value: "item-2",
  },
  {
    question: "Is my business data secure?",
    answer:
      "Yes, we take security very seriously. All data is encrypted in transit and at rest. We use enterprise-grade security measures and comply with GDPR standards. Your data is backed up daily.",
    value: "item-3",
  },
  {
    question: "Do you offer training and support?",
    answer: "Yes! We provide comprehensive documentation, video tutorials, and webinars. Growth and Enterprise plans include priority email support, while Enterprise customers get 24/7 phone support and a dedicated account manager.",
    value: "item-4",
  },
  {
    question: "Can I integrate BizTool with other software?",
    answer: "Yes, we offer integrations with popular accounting software, payment gateways, and other business tools. Enterprise plans include custom integration support.",
    value: "item-5",
  },
  {
    question: "What happens if I exceed my plan limits?",
    answer: "We'll notify you when you're approaching your limits. You can either upgrade to a higher plan or we can provide additional capacity as needed with flexible pricing.",
    value: "item-6",
  },
  {
    question: "Is there a mobile app?",
    answer: "Yes! BizTool is mobile-first by design. Our responsive web app works perfectly on all devices, and we also offer native iOS and Android apps for the best mobile experience.",
    value: "item-7",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, there are no long-term contracts. You can cancel your subscription at any time. Your data will remain accessible for 30 days after cancellation, and you can export it anytime.",
    value: "item-8",
  },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="container md:w-[700px] py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          FAQs
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold">
          Frequently Asked Questions
        </h2>
      </div>

      <Accordion type="single" collapsible className="AccordionRoot">
        {FAQList.map(({ question, answer, value }) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>

            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
