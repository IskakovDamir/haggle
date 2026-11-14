import { DirectoryIndexBody } from "@/components/directory/index-page";
import { indexMetadata } from "@/lib/directory/meta";

export const metadata = indexMetadata("es");

export default function TelefonosIndex() {
  return <DirectoryIndexBody lang="es" />;
}
