import { DirectoryIndexBody } from "@/components/directory/index-page";
import { indexMetadata } from "@/lib/directory/meta";

export const metadata = indexMetadata("en");

export default function PhoneIndex() {
  return <DirectoryIndexBody lang="en" />;
}
