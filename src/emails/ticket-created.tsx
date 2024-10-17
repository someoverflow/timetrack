import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Markdown,
  Preview,
  render,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { getTranslations } from "next-intl/server";
import * as React from "react";

type TicketCreatedMailData = {
  link: string;
  priority: string;
  task: string;
  description?: string;
  assignees?: string[];
  projects?: string[];
};

export default async function TicketCreatedMail({
  link,
  priority,
  task,
  description,
  assignees,
  projects,
}: TicketCreatedMailData) {
  const t = await getTranslations("Mail");

  if (projects && assignees) {
    while (projects.length < assignees.length) {
      projects.push(" - ");
    }
    while (projects.length > assignees.length) {
      assignees.push(" - ");
    }
  }

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{task}</Preview>
        <Body style={main}>
          <Container style={container}>
            <Text style={company} className="m-0">
              {t("newTicket")}
              {priority == "high" && (
                <sup className="text-xs rounded bg-red-600 text-white ml-2 p-1">
                  {t("important")}
                </sup>
              )}
            </Text>
            {(assignees !== undefined || projects !== undefined) && (
              <Section>
                <Row>
                  {projects && (
                    <Column>
                      <Text className="font-semibold">
                        {t("projects", { count: projects.length })}
                      </Text>
                      {projects?.map((p, i) => (
                        <Row key={i}>
                          <Column>
                            <Text
                              className={`text-gray-500 text-xs text-left m-0 ${p == " - " ? "opacity-0" : ""}`}
                            >
                              {p}
                            </Text>
                          </Column>
                        </Row>
                      ))}
                    </Column>
                  )}
                  {assignees && (
                    <Column>
                      <Text className="font-semibold">
                        {t("assignees", { count: assignees.length })}
                      </Text>
                      {assignees.map((a, i) => (
                        <Row key={i}>
                          <Column>
                            <Text
                              className={`text-gray-500 text-xs m-0 ${projects ? "text-right" : ""} ${a == " - " ? "opacity-0" : ""}`}
                            >
                              {a}
                            </Text>
                          </Column>
                        </Row>
                      ))}
                    </Column>
                  )}
                </Row>
              </Section>
            )}
            <Hr />
            <Heading style={codeTitle}>{task}</Heading>
            {description && (
              <Markdown markdownContainerStyles={{ textAlign: "start" }}>
                {description}
              </Markdown>
            )}
            <Hr />
            <Section className="text-center">
              <Button href={link} target="_blank" className="text-center">
                <Text className="inline-grid place-items-center rounded bg-black px-8 py-4 font-bold ">
                  {t("link")}
                </Text>
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export const TicketCreated = async (props?: any) => {
  return {
    html: await render(<TicketCreatedMail {...props} />, {
      pretty: true,
    }),
    text: await render(<TicketCreatedMail {...props} />, {
      plainText: true,
    }),
  };
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif",
  textAlign: "center" as const,
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #ddd",
  borderRadius: "5px",
  marginTop: "20px",
  width: "480px",
  maxWidth: "95%",
  margin: "0 auto",
  padding: "10% 6%",
};

const company = {
  fontWeight: "bold",
  fontSize: "18px",
  textAlign: "center" as const,
};

const codeTitle = {
  textAlign: "center" as const,
};
