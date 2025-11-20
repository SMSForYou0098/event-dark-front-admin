// const renderTiersModal = () => {
//         const { standIndex } = currentIndices;
//         const stand = standsWithCapacity[standIndex];

//         return (
//           <Modal
//             show={currentModal === "tiers"}
//             aria-labelledby="contained-modal-title-vcenter"
//       centered

//             onHide={closeModal}
//             size={isMobile ? "md" : "lg"}
//             style={{backgroundColor:"rgba(200, 200, 200,0.45)"}}
//             contentClassName="bg-dark text-light rounded-4 shadow-lg"
//             dialogClassName={isMobile ? "m-0 w-100" : ""}
//             backdrop="static" // This prevents closing when clicking outside
//             // backdropClassName="modal-backdrop-blur" // Add this class for blur effect
//           >
//             <Modal.Header
//             //   closeButton
//               className="border-secondary flex-wrap gap-2"
//             >
//               <Modal.Title
//                 className={`d-flex align-items-center flex-wrap gap-2 ${
//                   isMobile ? "fs-6" : ""
//                 }`}
//                 style={{ flex: 1, minWidth: 0 }}
//               >
//                 {stand?.name || `Stand ${standIndex + 1}`} - Tiers
//                 <Badge bg="info" className="text-dark">
//                   Capacity: {stand?.capacity}
//                 </Badge>
//               </Modal.Title>
//               <Button
//                 variant="success"
//                 onClick={() => addTier(standIndex)}
//                 className={isMobile ? "w-auto px-2 py-1" : ""}
//                 size={"sm"}
//               >
//                 <Plus
//                   size={ 18 }
//                   className={isMobile ? "" : "me-1"}
//                 />
//                 <span className={isMobile ? "d-none" : "d-inline"}>
//                   Add Tier
//                 </span>
//               </Button>
//             </Modal.Header>

//             <Modal.Body className={isMobile ? "p-2" : "p-4"}>
//               {!stand?.tiers || stand.tiers.length === 0 ? (
//                 <div className="text-center text-muted py-4 fs-6">
//                   🚫 No tiers created yet.
//                 </div>
//               ) : (
//                 <div
//                   className="table-responsive"
//                   style={{ minHeight: isMobile ? 200 : 300 }}
//                 >
//                   <Table
//                     bordered
//                     hover
//                     variant="dark"
//                     className="align-middle text-light mb-0"
//                     style={{ fontSize: isMobile ? "0.92rem" : "1rem" }}
//                   >
//                     <thead>
//                       <tr>
//                         <th
//                           style={{ minWidth: isMobile ? "7rem" : "10rem" }}
//                           className="text-center"
//                         >
//                           Tier Name
//                         </th>
//                         <th className="text-center">Blocked</th>
//                         <th className="text-center">Capacity</th>
//                         <th className="text-center">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {stand?.tiers?.map((tier, tierIndex) => (
//                         <tr key={tierIndex}>
//                           {/* Tier Name */}
//                           <td>
//                             <Form.Control
//                               type="text"
//                               value={tier.name}
//                               onChange={(e) =>
//                                 updateTierField(
//                                   standIndex,
//                                   tierIndex,
//                                   "name",
//                                   e.target.value
//                                 )
//                               }
//                               placeholder="Tier Name"
//                               required
//                               className={`bg-dark text-light border-secondary ${
//                                 isMobile ? "py-1 px-2" : ""
//                               }`}
//                               style={{
//                                 fontSize: isMobile ? "0.95rem" : "1rem",
//                               }}
//                             />
//                           </td>

//                           {/* Blocked Switch */}
//                           <td className="text-center">
//                             <Form.Check
//                               type="switch"
//                               label={tier.isBlocked ? "Blocked" : "Open"}
//                               checked={tier.isBlocked}
//                               onChange={(e) =>
//                                 updateTierField(
//                                   standIndex,
//                                   tierIndex,
//                                   "isBlocked",
//                                   e.target.checked
//                                 )
//                               }
//                               className="text-light"
//                               style={{
//                                 fontSize: isMobile ? "0.85rem" : "1rem",
//                               }}
//                             />
//                           </td>

//                           {/* Capacity */}
//                           <td className="text-center">
//                               {tier?.capacity}
//                           </td>

//                           {/* Actions */}
//                           <td className="text-center">
//                             <div
//                               className={`d-flex justify-content-center align-items-center ${
//                                 isMobile ? "gap-2" : "gap-3"
//                               }`}
//                             >
//                               <Button
//                                 variant="link"
//                                 onClick={() =>
//                                   openModal("sections", {
//                                     standIndex,
//                                     tierIndex,
//                                   })
//                                 }
//                                 className="p-0"
//                                 style={{ boxShadow: "none" }}
//                               >
//                                 <Layers
//                                   className="text-info"
//                                   size={isMobile ? 18 : 20}
//                                 />
//                               </Button>

//                               <Button
//                                 variant="link"
//                                 size="sm"
//                                 className="p-0"
//                                 onClick={() => {
//                                   removeTier(standIndex, tierIndex);
//                                   if (stand.tiers.length === 1) closeModal();
//                                 }}
//                                 style={{ boxShadow: "none" }}
//                               >
//                                 <Trash2
//                                   className="text-danger"
//                                   size={isMobile ? 18 : 20}
//                                 />
//                               </Button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </Table>
//                 </div>
//               )}
//             </Modal.Body>

//             <Modal.Footer
//               className={`border-secondary d-flex w-100 ${
//                 isMobile ? "flex-column gap-2" : "flex-row gap-2"
//               }`}
//             >
//               <Button
//                 variant="primary"
//                 onClick={closeModal}
//                 className={`${isMobile ? "w-100" : "px-4"} py-2`}
//                 style={{ minWidth: isMobile ? "auto" : 120 }}
//               >
//                 Cancel
//               </Button>
//             </Modal.Footer>
//           </Modal>
//         );
//     };


//     const renderSectionsModal = () => {
//         const { standIndex, tierIndex } = currentIndices;
//         const tier = standsWithCapacity[standIndex]?.tiers[tierIndex];

//         return (
//           <Modal
//             show={currentModal === "sections"}
//             onHide={closeModal}
//             size={isMobile ? "md" : "lg"}
//             centered
//             backdrop="static"
//             style={{ backgroundColor: "rgba(200, 200, 200, 0.65)" }}
//             contentClassName="bg-dark text-light rounded-4 shadow-lg"
//             dialogClassName={isMobile ? "m-0 w-100" : ""}
//           >
//             <Modal.Header className="border-secondary flex-wrap gap-2">
//               <Modal.Title
//                 className={`d-flex align-items-center flex-wrap gap-2 ${
//                   isMobile ? "fs-6" : ""
//                 }`}
//                 style={{ flex: 1, minWidth: 0 }}
//               >
//                 {tier?.name || `Tier ${tierIndex + 1}`} - Sections
//                 <Badge bg="info" className="text-dark">
//                   Capacity: {tier?.capacity}
//                 </Badge>
//               </Modal.Title>

//               <Button
//                 variant="success"
//                 onClick={() => addSection(standIndex, tierIndex)}
//                 className={isMobile ? "w-auto px-2 py-1" : ""}
//                 size="sm"
//               >
//                 <Plus size={18} className={isMobile ? "" : "me-1"} />
//                 <span className={isMobile ? "d-none" : "d-inline"}>
//                   Add Section
//                 </span>
//               </Button>
//             </Modal.Header>

//             <Modal.Body className={isMobile ? "p-2" : "p-4"}>
//               {!tier?.sections || tier.sections.length === 0 ? (
//                 <div className="text-center text-muted py-4 fs-6">
//                   🚫 No sections created yet.
//                 </div>
//               ) : (
//                 <div
//                   className="table-responsive"
//                   style={{ minHeight: isMobile ? 200 : 300 }}
//                 >
//                   <Table
//                     bordered
//                     hover
//                     variant="dark"
//                     className="align-middle text-light mb-0"
//                     style={{ fontSize: isMobile ? "0.92rem" : "1rem" }}
//                   >
//                     <thead>
//                       <tr>
//                         <th
//                           className="text-center"
//                           style={{ minWidth: isMobile ? "7rem" : "10rem" }}
//                         >
//                           Section Name
//                         </th>
//                         <th className="text-center">Blocked</th>
//                         <th className="text-center">Capacity</th>
//                         <th className="text-center">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {tier.sections.map((section, sectionIndex) => (
//                         <tr key={sectionIndex}>
//                           {/* Section Name */}
//                           <td>
//                             <Form.Control
//                               type="text"
//                               value={section.name}
//                               onChange={(e) =>
//                                 updateSectionField(
//                                   standIndex,
//                                   tierIndex,
//                                   sectionIndex,
//                                   "name",
//                                   e.target.value
//                                 )
//                               }
//                               placeholder="Section Name"
//                               required
//                               className={`bg-dark text-light border-secondary ${
//                                 isMobile ? "py-1 px-2" : ""
//                               }`}
//                               style={{
//                                 fontSize: isMobile ? "0.95rem" : "1rem",
//                               }}
//                             />
//                           </td>

//                           {/* Blocked Switch */}
//                           <td className="text-center">
//                             <Form.Check
//                               type="switch"
//                               label={section.isBlocked ? "Blocked" : "Open"}
//                               checked={section.isBlocked}
//                               onChange={(e) =>
//                                 updateSectionField(
//                                   standIndex,
//                                   tierIndex,
//                                   sectionIndex,
//                                   "isBlocked",
//                                   e.target.checked
//                                 )
//                               }
//                               className="text-light"
//                               style={{
//                                 fontSize: isMobile ? "0.85rem" : "1rem",
//                               }}
//                             />
//                           </td>

//                           {/* Capacity */}
//                           <td className="text-center">
//                             {section?.capacity ?? "—"}
//                           </td>

//                           {/* Actions */}
//                           <td className="text-center">
//                             <div
//                               className={`d-flex justify-content-center align-items-center ${
//                                 isMobile ? "gap-2" : "gap-3"
//                               }`}
//                             >
//                               <Button
//                                 variant="link"
//                                 onClick={() =>
//                                   openModal("rows", {
//                                     standIndex,
//                                     tierIndex,
//                                     sectionIndex,
//                                   })
//                                 }
//                                 className="p-0"
//                                 style={{ boxShadow: "none" }}
//                               >
//                                 <Rows
//                                   className="text-info"
//                                   size={isMobile ? 18 : 20}
//                                 />
//                               </Button>

//                               <Button
//                                 variant="link"
//                                 size="sm"
//                                 className="p-0"
//                                 onClick={() => {
//                                   removeSection(
//                                     standIndex,
//                                     tierIndex,
//                                     sectionIndex
//                                   );
//                                   if (tier.sections.length === 1) closeModal();
//                                 }}
//                                 style={{ boxShadow: "none" }}
//                               >
//                                 <Trash2
//                                   className="text-danger"
//                                   size={isMobile ? 18 : 20}
//                                 />
//                               </Button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </Table>
//                 </div>
//               )}
//             </Modal.Body>

//             <Modal.Footer
//               className={`border-secondary d-flex w-100 ${
//                 isMobile ? "flex-column gap-2" : "flex-row gap-2"
//               }`}
//             >
//               <Button
//                 variant="primary"
//                 onClick={closeModal}
//                 className={`${isMobile ? "w-100" : "px-4"} py-2`}
//                 style={{ minWidth: isMobile ? "auto" : 120 }}
//               >
//                 Cancel
//               </Button>
//             </Modal.Footer>
//           </Modal>
//         );
//     };


//     const renderRowsModal = () => {
//         const { standIndex, tierIndex, sectionIndex } = currentIndices;
//         const section = standsWithCapacity[standIndex]?.tiers[tierIndex]?.sections[sectionIndex];

//         return (
//           <Modal
//             show={currentModal === "rows"}
//             onHide={closeModal}
//             size={isMobile ? "md" : "lg"}
//             centered
//             backdrop="static"
//             style={{ backgroundColor: "rgba(200, 200, 200,0.6)" }}
//             contentClassName="bg-dark text-light rounded-4 shadow-lg"
//             dialogClassName={isMobile ? "m-0 w-100" : ""}
//           >
//             <Modal.Header className="border-secondary flex-wrap gap-2">
//               <Modal.Title
//                 className={`d-flex align-items-center flex-wrap gap-2 ${
//                   isMobile ? "fs-6" : ""
//                 }`}
//               >
//                 {section?.name || `Section ${sectionIndex + 1}`} - Rows
//                 <Badge bg="info" className="text-dark">
//                   Total: {section?.capacity} seats
//                 </Badge>
//               </Modal.Title>
//               <Button
//                 variant="success"
//                 onClick={() => addRow(standIndex, tierIndex, sectionIndex)}
//                 className={isMobile ? "w-auto px-2 py-1" : ""}
//                 size="sm"
//               >
//                 <Plus size={18} className={isMobile ? "" : "me-1"} />
//                 <span className={isMobile ? "d-none" : "d-inline"}>
//                   Add Row
//                 </span>
//               </Button>
//             </Modal.Header>

//             <Modal.Body className={isMobile ? "p-2" : "p-4"}>
//               {!section?.rows || section.rows.length === 0 ? (
//                 <div className="text-center text-muted py-4 fs-6">
//                   🚫 No rows created yet.
//                 </div>
//               ) : (
//                 <div className="table-responsive">
//                   <Table
//                     bordered
//                     hover
//                     variant="dark"
//                     className="align-middle text-light mb-0"
//                     style={{ fontSize: isMobile ? "0.92rem" : "1rem" }}
//                   >
//                     <thead>
//                       <tr>
//                         <th className="text-center">Label</th>
//                         <th className="text-center">Seats</th>
//                         <th className="text-center">Blocked</th>
//                         <th className="text-center">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {section.rows.map((row, rowIndex) => (
//                         <tr key={rowIndex}>
//                           {/* Label Input */}
//                           <td>
//                             <Form.Control
//                               type="text"
//                               placeholder="Row Label"
//                               value={row.label}
//                               onChange={(e) =>
//                                 updateRow(
//                                   standIndex,
//                                   tierIndex,
//                                   sectionIndex,
//                                   rowIndex,
//                                   "label",
//                                   e.target.value
//                                 )
//                               }
//                               className={`bg-dark text-light border-secondary ${
//                                 isMobile ? "py-1 px-2" : ""
//                               }`}
//                             />
//                           </td>

//                           {/* Seats Input */}
//                           <td>
//                             <Form.Control
//                               type="number"
//                               placeholder="Seats"
//                               value={row.seats}
//                               onChange={(e) =>
//                                 updateRow(
//                                   standIndex,
//                                   tierIndex,
//                                   sectionIndex,
//                                   rowIndex,
//                                   "seats",
//                                   e.target.value
//                                 )
//                               }
//                               className={`bg-dark text-light border-secondary ${
//                                 isMobile ? "py-1 px-2" : ""
//                               }`}
//                             />
//                           </td>

//                           {/* Blocked Switch */}
//                           <td className="text-center">
//                             <Form.Check
//                               type="switch"
//                               label={row.isBlocked ? "Blocked" : "Open"}
//                               checked={row.isBlocked}
//                               onChange={(e) =>
//                                 updateRow(
//                                   standIndex,
//                                   tierIndex,
//                                   sectionIndex,
//                                   rowIndex,
//                                   "isBlocked",
//                                   e.target.checked
//                                 )
//                               }
//                               className="text-light"
//                             />
//                           </td>

//                           {/* Actions */}
//                           <td className="text-center">
//                             <Button
//                               variant="link"
//                               size="sm"
//                               onClick={() => {
//                                 removeRow(
//                                   standIndex,
//                                   tierIndex,
//                                   sectionIndex,
//                                   rowIndex
//                                 );
//                                 if (section.rows.length === 1) closeModal();
//                               }}
//                               className="p-0"
//                               style={{ boxShadow: "none" }}
//                             >
//                               <Trash2
//                                 className="text-primary"
//                                 size={isMobile ? 18 : 20}
//                               />
//                             </Button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </Table>
//                 </div>
//               )}
//             </Modal.Body>

//             <Modal.Footer
//               className={`border-secondary d-flex w-100 ${
//                 isMobile ? "flex-column gap-2" : "flex-row gap-2"
//               }`}
//             >
//               <Button
//                 variant="primary"
//                 onClick={closeModal}
//                 className={`${isMobile ? "w-100" : "px-4"} py-2`}
//                 style={{ minWidth: isMobile ? "auto" : 120 }}
//               >
//                 Cancel
//               </Button>
//             </Modal.Footer>
//           </Modal>
//         );
//     };