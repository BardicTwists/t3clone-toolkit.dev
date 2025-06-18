import { db } from "@/server/db";
import { ChatProvider } from "@/app/_contexts/chat-context";
import type { Message, Workbench } from "@prisma/client";
import { ChatLayout } from "./layout";
import type { Attachment, UIMessage } from "ai";
import { languageModels } from "@/ai/models";
import { ChatContent } from "./chat";

interface Props {
  id: string;
  initialVisibilityType: "public" | "private";
  isReadonly: boolean;
  isNew: boolean;
  workbench?: Workbench;
}

export const Chat = async ({
  id,
  initialVisibilityType,
  isReadonly,
  isNew,
  workbench,
}: Props) => {
  const initialMessages = isNew
    ? []
    : await db.message.findMany({
        where: {
          chatId: id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

  const convertToUIMessages = (messages: Array<Message>): Array<UIMessage> => {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage["parts"],
      role: message.role as UIMessage["role"],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: "",
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as unknown as Array<Attachment>) ?? [],
      annotations: message.modelId
        ? [
            {
              type: "model",
              model: (() => {
                const model = languageModels.find(
                  (model) => model.modelId === message.modelId.split(":")[1],
                );

                if (!model) {
                  return null;
                }

                return {
                  name: model.name,
                  provider: model.provider,
                  modelId: model.modelId,
                };
              })(),
            },
          ]
        : undefined,
    }));
  };

  return (
    <ChatLayout>
      <ChatProvider
        id={id}
        initialMessages={convertToUIMessages(initialMessages)}
        initialVisibilityType={initialVisibilityType}
        autoResume={!isNew}
        workbench={workbench}
      >
        <ChatContent
          id={id}
          isReadonly={isReadonly}
          hasInitialMessages={initialMessages.length > 0}
        />
      </ChatProvider>
    </ChatLayout>
  );
};
