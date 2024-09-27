import type { TicketStatus } from "@prisma/client";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  render,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { getTranslations } from "next-intl/server";
import * as React from "react";

export type TicketInfo = {
  link: string;
  status: TicketStatus;
  priority: string;
  task: string;
  description?: string;
  assignees?: string | null;
  projects?: string | null;
};

export type TicketCreatedMailData = {
  created?: TicketInfo[];
  updated?: TicketInfo[];
  profileLink: string;
};

export default async function TicketCreatedMail({
  created,
  updated,
  profileLink = "https://localhost:3000/profile",
}: TicketCreatedMailData) {
  const t = await getTranslations("Mail");

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{t("dailyUpdate")}</Preview>
        <Body style={main}>
          <Container style={container}>
            <Text style={company} className="m-0">
              {t("dailyUpdate")}
            </Text>
            {created && created.length !== 0 && (
              <Section>
                <Text style={codeDescription}>{t("newTickets")}</Text>
                {created.map((ticket) => (
                  <Row className="mb-2 mt-2" key={ticket.link}>
                    <Column className="p-10 w-full bg-black/90 text-white rounded-lg text-left shadow-md">
                      <Row>
                        <Column>
                          <Section>
                            <Row>
                              <Column>{ticket.task}</Column>
                            </Row>
                            {ticket.description && (
                              <Row>
                                <Column className="text-xs text-gray-300">
                                  {ticket.description}
                                </Column>
                              </Row>
                            )}
                          </Section>
                        </Column>
                        <Column className="text-end">
                          <Button
                            href={ticket.link}
                            className="bg-white py-2 px-3 text-xs rounded-md"
                          >
                            {t("open")}
                          </Button>
                        </Column>
                      </Row>

                      {(ticket.projects !== null ||
                        ticket.assignees !== null) && (
                        <div>
                          <Hr />

                          <Section>
                            {ticket.assignees && (
                              <Text className="text-xs m-0">
                                <span className="text-gray-300">
                                  {t("updateAssigneees")}
                                </span>
                                {ticket.assignees}
                              </Text>
                            )}
                            {ticket.projects && (
                              <Text className="text-xs m-0">
                                <span className="text-gray-300">
                                  {t("updateProjects")}
                                </span>
                                {ticket.projects}
                              </Text>
                            )}
                          </Section>
                        </div>
                      )}
                    </Column>
                  </Row>
                ))}
              </Section>
            )}
            {updated && updated.length !== 0 && (
              <Section>
                <Text style={codeDescription}>{t("updatedTickets")}</Text>
                {updated.map((ticket) => (
                  <Row className="mb-2 mt-2" key={ticket.link}>
                    <Column className="p-10 w-full bg-black/90 text-white rounded-lg text-left shadow-md">
                      <Row>
                        <Column>
                          <Section>
                            <Row>
                              <Column>
                                {ticket.task}
                                <sup
                                  className={`ml-2 text-xs text-black p-1 rounded-md ${
                                    {
                                      TODO: "bg-blue-500",
                                      IN_PROGRESS: "bg-amber-500",
                                      DONE: "bg-emerald-500",
                                    }[ticket.status]
                                  }`}
                                >
                                  {
                                    {
                                      TODO: t("ticket.open"),
                                      IN_PROGRESS: t("ticket.inProgress"),
                                      DONE: t("ticket.done"),
                                    }[ticket.status]
                                  }
                                </sup>
                              </Column>
                            </Row>
                            {ticket.description && (
                              <Row>
                                <Column className="text-xs text-gray-300">
                                  {ticket.description}
                                </Column>
                              </Row>
                            )}
                          </Section>
                        </Column>
                        <Column className="text-end">
                          <Button
                            href={ticket.link}
                            className="bg-white py-2 px-3 text-xs rounded-md"
                          >
                            {t("open")}
                          </Button>
                        </Column>
                      </Row>

                      {(ticket.projects !== null ||
                        ticket.assignees !== null) && (
                        <div>
                          <Hr />

                          <Section>
                            {ticket.assignees && (
                              <Text className="text-xs m-0">
                                <span className="text-gray-300">
                                  {t("updateAssigneees")}
                                </span>
                                {ticket.assignees}
                              </Text>
                            )}
                            {ticket.projects && (
                              <Text className="text-xs m-0">
                                <span className="text-gray-300">
                                  {t("updateProjects")}
                                </span>
                                {ticket.projects}
                              </Text>
                            )}
                          </Section>
                        </div>
                      )}
                    </Column>
                  </Row>
                ))}
              </Section>
            )}
            <Hr />
            <Section className="text-center">
              <Button href={profileLink}>
                <Text className="text-gray-600 underline">
                  {t("deactivate.update")}
                </Text>
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export const TicketUpdate = async (props?: any) => {
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

const codeDescription = {
  textAlign: "center" as const,
};
