import React, { useEffect, useMemo, useState } from "react";

import { Loader2 } from "lucide-react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VStack } from "@/components/ui/stack";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { ClientToolkitConfigure } from "@/components/toolkit/toolkit-configure";

import { clientToolkits } from "@/toolkits/toolkits/client";

import { cn } from "@/lib/utils";

import type { ClientToolkit } from "@/toolkits/types";
import type { Toolkits } from "@/toolkits/toolkits/shared";
import type { SelectedToolkit } from "./types";

interface ToolkitListProps {
  selectedToolkits: SelectedToolkit[];
  onAddToolkit: (toolkit: SelectedToolkit) => void;
  onRemoveToolkit: (id: Toolkits) => void;
}

const toolkitItemHeight = 48;
const numToolkitsToShow = 5;

export const ToolkitList: React.FC<ToolkitListProps> = ({
  selectedToolkits,
  onAddToolkit,
  onRemoveToolkit,
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToolkitForConfig, setSelectedToolkitForConfig] = useState<{
    id: Toolkits;
    toolkit: ClientToolkit;
  } | null>(null);

  const filteredToolkits = useMemo(() => {
    return Object.entries(clientToolkits).filter(([, toolkit]) => {
      return (
        searchQuery.toLowerCase() === "" ||
        toolkit.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  useEffect(() => {
    const updatedToolkits = Object.entries(clientToolkits).filter(([id]) => {
      return (
        searchParams.get(id) === "true" &&
        !selectedToolkits.some((t) => t.id === (id as Toolkits))
      );
    });

    if (updatedToolkits.length > 0) {
      updatedToolkits.forEach(([id, toolkit]) => {
        onAddToolkit({
          id: id as Toolkits,
          parameters: {},
          toolkit: toolkit as ClientToolkit,
        });
      });
      window.history.replaceState({}, "", pathname);
    }
  }, [searchParams, onAddToolkit, selectedToolkits, router, pathname]);

  const handleToolkitAction = (id: Toolkits, toolkit: ClientToolkit) => {
    const isSelected = selectedToolkits.some((t) => t.id === id);
    const needsConfiguration = Object.keys(toolkit.parameters.shape).length > 0;

    if (isSelected) {
      onRemoveToolkit(id);
    } else if (needsConfiguration) {
      setSelectedToolkitForConfig({ id, toolkit });
    } else {
      onAddToolkit({ id, toolkit, parameters: {} });
    }
  };

  const handleConfigureSubmit = (toolkit: SelectedToolkit) => {
    if (selectedToolkitForConfig) {
      onAddToolkit(toolkit);
      setSelectedToolkitForConfig(null);
    }
  };

  return (
    <>
      <Command className="bg-transparent">
        <CommandInput
          placeholder="Search toolkits..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList
          style={{
            height: `${toolkitItemHeight * (numToolkitsToShow + 0.5)}px`,
          }}
        >
          <CommandEmpty>No toolkits match your search</CommandEmpty>
          <CommandGroup className="p-0">
            {filteredToolkits.map(([id, toolkit]) => {
              const isSelected = selectedToolkits.some(
                (t) => t.id === (id as Toolkits),
              );

              const Item = ({
                isLoading,
                onSelect,
              }: {
                isLoading: boolean;
                onSelect?: () => void;
              }) => (
                <CommandItem
                  key={id}
                  onSelect={
                    onSelect ??
                    (() =>
                      handleToolkitAction(
                        id as Toolkits,
                        toolkit as ClientToolkit,
                      ))
                  }
                  className="flex items-center gap-2 rounded-none px-3"
                  disabled={isLoading}
                >
                  <div
                    className={cn(
                      "rounded-full border p-1",
                      isSelected && "border-primary text-primary",
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <toolkit.icon
                        className={cn("size-4", isSelected && "text-primary")}
                      />
                    )}
                  </div>

                  <VStack className="flex flex-1 flex-col items-start gap-0">
                    <h3 className="text-sm font-medium">{toolkit.name}</h3>
                    <p className="text-muted-foreground text-xs">
                      {toolkit.description}
                    </p>
                  </VStack>
                </CommandItem>
              );

              if (toolkit.Wrapper) {
                return <toolkit.Wrapper key={id} Item={Item} />;
              }

              return <Item key={id} isLoading={false} />;
            })}
          </CommandGroup>
        </CommandList>
      </Command>
      <Dialog
        open={selectedToolkitForConfig !== null}
        onOpenChange={() => setSelectedToolkitForConfig(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedToolkitForConfig?.toolkit.name}
            </DialogTitle>
          </DialogHeader>
          {selectedToolkitForConfig && (
            <ClientToolkitConfigure
              toolkit={selectedToolkitForConfig.toolkit}
              id={selectedToolkitForConfig.id}
              schema={selectedToolkitForConfig.toolkit.parameters}
              onAdd={handleConfigureSubmit}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
